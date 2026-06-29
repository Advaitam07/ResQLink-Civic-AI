import { Request, Response } from "express";
import { DatabaseService } from "../database/DatabaseService";
import { Logger } from "../utils/logger";

export class ResourceController {
  
  static async getAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const alerts = await DatabaseService.fetchAllResourceAlerts();
      return res.status(200).json(alerts);
    } catch (error: any) {
      Logger.error("ResourceController.getAlerts failed", error);
      return res.status(500).json({ error: "Failed to retrieve resource alerts" });
    }
  }

  static async createAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { crewId, crewName, leaderName, leaderPhone, message } = req.body;

      if (!crewId || !crewName || !leaderName || !leaderPhone || !message) {
        return res.status(400).json({ error: "Missing required parameter fields" });
      }

      const newAlert = {
        id: `alt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        crewId,
        crewName,
        leaderName,
        leaderPhone,
        message,
        timestamp: new Date().toISOString(),
        status: "DELIVERED"
      };

      await DatabaseService.createResourceAlert(newAlert);
      Logger.info(`Successfully dispatched live alert to ${leaderName}'s device: ${leaderPhone}`);

      return res.status(201).json(newAlert);
    } catch (error: any) {
      Logger.error("ResourceController.createAlert failed", error);
      return res.status(500).json({ error: "Failed to dispatch resource alert" });
    }
  }
}
