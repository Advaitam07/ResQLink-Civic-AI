import { CivicUser } from "../../types";
import { DatabaseService } from "../database/DatabaseService";

export class LeaderboardService {
  static async getLeaderboard(): Promise<CivicUser[]> {
    return await DatabaseService.fetchAllUsers();
  }
}
