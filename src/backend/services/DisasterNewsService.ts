import { GoogleGenAI } from "@google/genai";
import { Logger } from "../utils/logger";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export class DisasterNewsService {
  
  static async generateBriefing(newsItems: any[]): Promise<string> {
    try {
      if (!newsItems || newsItems.length === 0) {
        return "No active disasters reported. Monitoring channels.";
      }

      const formattedNews = newsItems.map((item, idx) => {
        return `${idx + 1}. [${item.category}] ${item.title} (${item.location}) - Severity: ${item.severity}. Impact: ${item.impact}. Detail: ${item.description}`;
      }).join("\n\n");

      const promptText = `You are the Commander AI for ResQLink. Summarize and synthesize the following live disaster streams and active community risks into a brief, highly professional command bulletin:

${formattedNews}

Generate:
1. A concise, authoritative high-level situation report (1 paragraph, focus on coordination and state of current threats).
2. A prioritized 3-point tactical command directive (bullet points with clear action recommendations, e.g., deploy resources, alert regions, monitor parameters).

Do not include markdown headers like '#' or '##'. Keep it clean, professional, and dense with practical recommendations.`;

      Logger.info("DisasterNewsService: Consulting Gemini for crisis news synthesis.");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText
      });

      const text = response.text || "Failed to generate AI disaster briefing. Keep channels monitored.";
      Logger.info("DisasterNewsService: Gemini news briefing generated successfully.");
      return text;
    } catch (error) {
      Logger.info("Failed to generate AI briefing in DisasterNewsService, gracefully falling back", error);
      return "Notice: ResQLink central AI network is recalibrating. Operational brief fallback: Keep local routes clear, maintain sandbag supplies for flooded sectors, and avoid Eastern Santa Rosa red flag regions.";
    }
  }
}
