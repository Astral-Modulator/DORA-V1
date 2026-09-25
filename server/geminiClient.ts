import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not configured. Please add your key in Settings > Secrets."
    );
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return genAIClient;
}

export const PRIMARY_MODEL = "gemini-3.1-flash-lite";
export const ADVANCED_MODEL = "gemini-3.7-flash";

export async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}) {
  const ai = getGeminiClient();
  const modelToTry = params.preferredModel || PRIMARY_MODEL;

  try {
    return await ai.models.generateContent({
      model: modelToTry,
      contents: params.contents,
      config: params.config,
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn(`Initial call failed on ${modelToTry}: ${errMsg.slice(0, 120)}`);

    // If primary was not gemini-3.1-flash-lite, try gemini-3.1-flash-lite without fancy tools
    if (modelToTry !== PRIMARY_MODEL) {
      console.log(`Retrying with stable model: ${PRIMARY_MODEL}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // If the config had googleSearch and it failed with 429, try without googleSearch
      let safeConfig = params.config;
      if (errMsg.includes("429") || errMsg.includes("quota")) {
        safeConfig = { ...params.config };
        delete safeConfig.tools;
      }

      return await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: params.contents,
        config: safeConfig,
      });
    }

    // If it was already PRIMARY_MODEL and had 429 on tools, try without tools
    if (params.config?.tools && (errMsg.includes("429") || errMsg.includes("quota"))) {
      console.log(`Retrying on ${PRIMARY_MODEL} without tool invocation...`);
      const safeConfig = { ...params.config };
      delete safeConfig.tools;
      return await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: params.contents,
        config: safeConfig,
      });
    }

    throw err;
  }
}
