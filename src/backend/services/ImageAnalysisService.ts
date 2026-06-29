import { GoogleGenAI, Type } from "@google/genai";
import { StorageService } from "../storage/StorageService";
import { Logger } from "../utils/logger";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export class ImageAnalysisService {
  
  static async analyzeImage(imageBase64: string, mimeType: string, presetId?: string): Promise<any> {
    const filePayload = StorageService.processBase64Upload(imageBase64, mimeType);
    if (!filePayload) {
      throw new Error("Invalid base64 payload layout");
    }

    try {
      // If we are dealing with mock datasets or short strings, skip live API calls
      if (imageBase64 === "MOCK_DATA" || imageBase64.length < 150) {
        throw new Error("Simulated mock image payload, bypassing live calls");
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      };

      const textPart = {
        text: `You are the core analyzer engine for ResQLink Civic AI. Analyze this image of a civic issue (it could be a pothole, illegal garbage dump, water pipe leak, broken street lamp, damaged utility, road cracks, public hazard, etc.). 
      
      Extract and structure the analysis in raw JSON. 
      If the image does not seem to contain a standard civic issue, catalog it appropriately under 'Environment' or 'Safety' as a mild issue and describe it politely.

      Provide a suitable professional title, precise description, correct category ('Roads' | 'Sanitation' | 'Utilities' | 'Safety' | 'Environment'), estimate severity ('Low' | 'Medium' | 'High' | 'Critical') based on safety risk, estimate a thorough 'communityImpact' statement, and generate EXACTLY 3 actionable 'recommendedActions' to fix the problem.`
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { 
                type: Type.STRING, 
                enum: ["Roads", "Sanitation", "Utilities", "Safety", "Environment"]
              },
              severity: { 
                type: Type.STRING, 
                enum: ["Low", "Medium", "High", "Critical"]
              },
              communityImpact: { type: Type.STRING },
              recommendedActions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              }
            },
            required: ["title", "description", "category", "severity", "communityImpact", "recommendedActions"]
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (err: any) {
      Logger.info(`ImageAnalysisService: Fallback triggered due to: ${err.message || err}`);
      return StorageService.getFallbackPreset(presetId || "");
    }
  }
}
