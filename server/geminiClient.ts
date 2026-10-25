import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not configured. Please set it in your Vercel project settings."
    );
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }

  return genAIClient;
}

// Active, verified production model IDs (2026)
export const PRIMARY_MODEL = "gemini-3.5-flash-lite";   // fast, cost-efficient, active
export const ADVANCED_MODEL = "gemini-3.5-flash";        // higher capability, verified active
export const BACKUP_MODEL = "gemini-flash-lite-latest";  // resilient fallback alias

/** Returns true for transient errors that are safe to retry on the same model */
function isRetryable(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up")
  );
}

/** Sleep for `ms` milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff with full jitter.
 * delay = random(0, min(cap, base * 2^attempt))
 */
function backoffMs(attempt: number, baseMs = 500, capMs = 3_000): number {
  const exponential = Math.min(capMs, baseMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * exponential);
}

/** Race a promise against a timeout */
export function withTimeout<T>(promise: Promise<T>, ms: number, description = "Operation"): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${description} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

export interface GenerateParams {
  contents: any;
  config?: any;
  /** Override which model to try first. Defaults to PRIMARY_MODEL. */
  preferredModel?: string;
  /** Per-call timeout in milliseconds (defaults to 20,000ms) */
  timeoutMs?: number;
}

/**
 * Calls generateContent with bounded exponential backoff + jitter + hard per-call timeout.
 * Sequence:
 *   1. Try primary model up to maxRetries times (with backoff on retryable errors).
 *   2. If primary fails or returns 404, fallback to ADVANCED_MODEL.
 *   3. If ADVANCED_MODEL fails, fallback to BACKUP_MODEL.
 */
export async function generateContentWithRetry(
  params: GenerateParams,
  maxRetries = 2
) {
  const ai = getGeminiClient();
  const primary = params.preferredModel || PRIMARY_MODEL;
  const perCallTimeout = params.timeoutMs || 22_000;

  let lastErr: unknown;

  // Phase 1 – primary model
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GeminiClient] Calling ${primary} (attempt ${attempt + 1}/${maxRetries + 1})...`);
      const response = await withTimeout(
        ai.models.generateContent({
          model: primary,
          contents: params.contents,
          config: params.config,
        }),
        perCallTimeout,
        `Gemini generateContent (${primary})`
      );
      return response;
    } catch (err: unknown) {
      lastErr = err;
      const msg = String((err as any)?.message ?? err);
      console.warn(
        `[GeminiClient] ${primary} attempt ${attempt + 1}/${maxRetries + 1} failed: ${msg.slice(0, 160)}`
      );

      // 404 or unretryable -> break immediately to try fallback model
      if (!isRetryable(err) || attempt === maxRetries) break;

      // Strip googleSearch tool on quota/rate-limit errors
      if (
        params.config?.tools &&
        (msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted"))
      ) {
        params = { ...params, config: { ...params.config, tools: undefined } };
        console.log(`[GeminiClient] Removed tools from config for retry attempt ${attempt + 2}.`);
      }

      const delay = backoffMs(attempt);
      console.log(`[GeminiClient] Backing off for ${delay}ms before retry ${attempt + 2}...`);
      await sleep(delay);
    }
  }

  // Phase 2 – fallback to ADVANCED_MODEL
  const fallbackModel = primary === ADVANCED_MODEL ? BACKUP_MODEL : ADVANCED_MODEL;
  console.warn(`[GeminiClient] Primary model (${primary}) failed. Attempting fallback: ${fallbackModel}`);

  // Strip tools for fallback to maximize success probability
  const fallbackConfig = params.config?.tools
    ? { ...params.config, tools: undefined }
    : params.config;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      console.log(`[GeminiClient] Calling fallback ${fallbackModel} (attempt ${attempt + 1}/2)...`);
      const response = await withTimeout(
        ai.models.generateContent({
          model: fallbackModel,
          contents: params.contents,
          config: fallbackConfig,
        }),
        perCallTimeout,
        `Gemini fallback generateContent (${fallbackModel})`
      );
      console.log(`[GeminiClient] Fallback to ${fallbackModel} succeeded.`);
      return response;
    } catch (err: unknown) {
      lastErr = err;
      const msg = String((err as any)?.message ?? err);
      console.warn(
        `[GeminiClient] ${fallbackModel} fallback attempt ${attempt + 1}/2 failed: ${msg.slice(0, 160)}`
      );
      if (!isRetryable(err) || attempt === 1) break;
      await sleep(backoffMs(attempt, 600, 2000));
    }
  }

  // Phase 3 - ultimate backup model if fallback wasn't already BACKUP_MODEL
  if (fallbackModel !== BACKUP_MODEL && primary !== BACKUP_MODEL) {
    try {
      console.warn(`[GeminiClient] Attempting ultimate backup model: ${BACKUP_MODEL}`);
      const response = await withTimeout(
        ai.models.generateContent({
          model: BACKUP_MODEL,
          contents: params.contents,
          config: fallbackConfig,
        }),
        perCallTimeout,
        `Gemini backup generateContent (${BACKUP_MODEL})`
      );
      console.log(`[GeminiClient] Backup ${BACKUP_MODEL} succeeded.`);
      return response;
    } catch (err: unknown) {
      lastErr = err;
      console.warn(`[GeminiClient] Ultimate backup model ${BACKUP_MODEL} failed:`, String(err).slice(0, 160));
    }
  }

  throw lastErr;
}
