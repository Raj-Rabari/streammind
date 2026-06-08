import { GoogleGenAI } from "@google/genai";
import type { LogMessage } from "../shared/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class LogAnalyzer {
  public static async analyzeContext(
    containerName: string,
    recentLogs: LogMessage[],
  ): Promise<string> {
    if (recentLogs.length === 0) {
      return "No logs available to analyze.";
    }

    // 1. Format the logs into a dense, token-efficient string
    const logText = recentLogs
      .map((l) => `[${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");

    // 2. The System Prompt (Engineering the AI's behavior)
    const prompt = `
      You are an expert DevOps AI assistant analyzing a Docker container named "${containerName}".
      Below are the most recent log lines from the container's output stream.
      
      Your task:
      1. Identify any critical errors, warnings, or crash loops.
      2. Briefly explain what the container is currently doing.
      3. Suggest a specific troubleshooting step if an error is present.
      
      Keep your response concise, technical, and formatted in Markdown. Do not hallucinate.

      --- LOG CONTEXT ---
      ${logText}
    `;

    try {
      console.log(
        `[AI] Sending ${recentLogs.length} lines to Gemini for analysis...`,
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "Analysis failed to generate a response.";
    } catch (error: any) {
      console.error("[AI Error]", error);
      throw new Error(`Failed to analyze logs: ${error.message}`);
    }
  }
}
