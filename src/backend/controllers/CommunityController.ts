import { Request, Response } from "express";
import { DatabaseService } from "../database/DatabaseService";
import { Logger } from "../utils/logger";

export class CommunityController {
  
  static async getMutualAidRequests(req: Request, res: Response): Promise<Response> {
    try {
      const requests = await DatabaseService.fetchAllMutualAidRequests();
      return res.status(200).json(requests);
    } catch (error: any) {
      Logger.error("CommunityController.getMutualAidRequests failed", error);
      return res.status(500).json({ error: "Failed to fetch mutual aid boards" });
    }
  }

  static async createMutualAidRequest(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, type, category, authorName, authorEmail, contactInfo, location } = req.body;

      if (!title || !description || !type || !category || !authorName || !authorEmail) {
        return res.status(400).json({ error: "Missing required aid parameter fields" });
      }

      const newRequest = {
        id: `aid_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title,
        description,
        type, // "request" | "offer"
        category,
        authorName,
        authorEmail,
        contactInfo: contactInfo || "N/A",
        location: location || "Mission District",
        status: "Active",
        timestamp: new Date().toISOString()
      };

      await DatabaseService.createMutualAidRequest(newRequest);
      return res.status(201).json(newRequest);
    } catch (error: any) {
      Logger.error("CommunityController.createMutualAidRequest failed", error);
      return res.status(500).json({ error: "Failed to dispatch mutual aid request" });
    }
  }

  static async fulfillMutualAidRequest(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body; // usually "Fulfilled"
      
      await DatabaseService.updateMutualAidRequestStatus(id, status || "Fulfilled");
      return res.status(200).json({ success: true, message: `Status updated to ${status || 'Fulfilled'}` });
    } catch (error: any) {
      Logger.error("CommunityController.fulfillMutualAidRequest failed", error);
      return res.status(500).json({ error: "Failed to update mutual aid request" });
    }
  }

  static async getFinalSafeguard(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: "Missing user email parameter" });
      }
      
      const safeguard = await DatabaseService.fetchFinalSafeguard(String(email));
      if (!safeguard) {
        return res.status(200).json(null);
      }
      return res.status(200).json(safeguard);
    } catch (error: any) {
      Logger.error("CommunityController.getFinalSafeguard failed", error);
      return res.status(500).json({ error: "Failed to fetch safeguard registry" });
    }
  }

  static async saveFinalSafeguard(req: Request, res: Response): Promise<Response> {
    try {
      const { email, name, message, contacts, status } = req.body;

      if (!email || !name || !message || !contacts) {
        return res.status(400).json({ error: "Missing required safeguard parameters" });
      }

      const safeguard = {
        email: email.toLowerCase(),
        name,
        message,
        contacts,
        status: status || "INACTIVE",
        updatedAt: new Date().toISOString()
      };

      await DatabaseService.saveFinalSafeguard(safeguard);
      return res.status(200).json(safeguard);
    } catch (error: any) {
      Logger.error("CommunityController.saveFinalSafeguard failed", error);
      return res.status(500).json({ error: "Failed to save final safeguard" });
    }
  }
}
