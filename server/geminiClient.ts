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

// Verified model IDs against Google AI SDK (as of 2025)
export const PRIMARY_MODEL = "gemini-2.5-flash-lite";   // fast, cost-efficient
export const ADVANCED_MODEL = "gemini-2.5-flash";        // higher capability fallback

/** Returns true for transient errors that are safe to retry */
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
function backoffMs(attempt: number, baseMs = 800, capMs = 12_000): number {
  const exponential = Math.min(capMs, baseMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * exponential);
}

export interface GenerateParams {
  contents: any;
  config?: any;
  /** Override which model to try first. Defaults to PRIMARY_MODEL. */
  preferredModel?: string;
}

/**
 * Calls generateContent with bounded exponential backoff + jitter.
 * Sequence:
 *   1. Try preferredModel up to MAX_RETRIES times (with backoff on retryable errors).
 *   2. If still failing and preferredModel !== ADVANCED_MODEL, try ADVANCED_MODEL once.
 *   3. Throw the last error if everything fails.
 */
export async function generateContentWithRetry(
  params: GenerateParams,
  maxRetries = 4
) {
  const ai = getGeminiClient();
  const primary = params.preferredModel || PRIMARY_MODEL;

  let lastErr: unknown;

  // Phase 1 – retry on primary model
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: primary,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: unknown) {
      lastErr = err;
      const msg = String((err as any)?.message ?? err);
      console.warn(
        `[GeminiClient] ${primary} attempt ${attempt + 1}/${maxRetries + 1} failed: ${msg.slice(0, 160)}`
      );

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

  // Phase 2 – fallback to ADVANCED_MODEL if primary wasn't already it
  if (primary !== ADVANCED_MODEL) {
    console.warn(`[GeminiClient] Primary model exhausted retries. Attempting fallback: ${ADVANCED_MODEL}`);
    // Strip tools for fallback to maximise success chance
    const fallbackConfig = params.config?.tools
      ? { ...params.config, tools: undefined }
      : params.config;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: ADVANCED_MODEL,
          contents: params.contents,
          config: fallbackConfig,
        });
        console.log(`[GeminiClient] Fallback to ${ADVANCED_MODEL} succeeded.`);
        return response;
      } catch (err: unknown) {
        lastErr = err;
        const msg = String((err as any)?.message ?? err);
        console.warn(
          `[GeminiClient] ${ADVANCED_MODEL} fallback attempt ${attempt + 1}/3 failed: ${msg.slice(0, 160)}`
        );
        if (!isRetryable(err) || attempt === 2) break;
        await sleep(backoffMs(attempt, 1200));
      }
    }
  }

  throw lastErr;
}
