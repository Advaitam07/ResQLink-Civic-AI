import { Request, Response } from "express";
import { ImageAnalysisService } from "../services/ImageAnalysisService";
import { HealthScoreService } from "../services/HealthScoreService";
import { ChatService } from "../services/ChatService";
import { DisasterNewsService } from "../services/DisasterNewsService";
import { Logger } from "../utils/logger";

export class AIController {
  
  static async analyzeImageUpload(req: Request, res: Response): Promise<Response> {
    try {
      const { imageBase64, mimeType, presetId } = req.body;

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "Missing required params imageBase64 or mimeType" });
      }

      const parsedAnalysis = await ImageAnalysisService.analyzeImage(imageBase64, mimeType, presetId);
      return res.status(200).json(parsedAnalysis);
    } catch (error: any) {
      Logger.error("AIController.analyzeImageUpload failed", error);
      return res.status(500).json({ error: error.message || "Failed to analyze evidence image" });
    }
  }

  static async checkHealthScore(req: Request, res: Response): Promise<Response> {
    try {
      const statsSummary = await HealthScoreService.evaluateCommunityHealth();
      return res.status(200).json(statsSummary);
    } catch (error: any) {
      Logger.error("AIController.checkHealthScore failed", error);
      return res.status(500).json({ error: "Failed to evaluate community indicators" });
    }
  }

  static async conversationalChat(req: Request, res: Response): Promise<Response> {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array list is required" });
      }

      const assistantReplyText = await ChatService.processChat(messages);
      return res.status(200).json({ text: assistantReplyText });
    } catch (error: any) {
      Logger.error("AIController.conversationalChat failed", error);
      return res.status(500).json({ error: "Failed to execute bot response" });
    }
  }

  static async generateDisasterNewsBriefing(req: Request, res: Response): Promise<Response> {
    try {
      const { newsItems } = req.body;
      const briefing = await DisasterNewsService.generateBriefing(newsItems);
      return res.status(200).json({ briefing });
    } catch (error: any) {
      Logger.error("AIController.generateDisasterNewsBriefing failed", error);
      return res.status(500).json({ error: "Failed to generate AI disaster news briefing" });
    }
  }
}
