import { Request, Response } from "express";
import { LeaderboardService } from "../services/LeaderboardService";
import { Logger } from "../utils/logger";

export class LeaderboardController {
  
  static async getLeaderboardList(req: Request, res: Response): Promise<Response> {
    try {
      const usersList = await LeaderboardService.getLeaderboard();
      return res.status(200).json(usersList);
    } catch (error: any) {
      Logger.error("LeaderboardController.getLeaderboardList failed", error);
      return res.status(500).json({ error: "Failed to read user points board" });
    }
  }
}
