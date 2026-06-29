import { Request, Response } from "express";
import { IssueService } from "../services/IssueService";
import { Validator } from "../validation/validator";
import { Logger } from "../utils/logger";

export class IssueController {
  
  static async getAllIssues(req: Request, res: Response): Promise<Response> {
    try {
      const { lat, lng, radius } = req.query;
      
      let parsedLat: number | undefined;
      let parsedLng: number | undefined;
      let parsedRadius: number | undefined;

      if (lat && lng && radius) {
        parsedLat = parseFloat(lat as string);
        parsedLng = parseFloat(lng as string);
        parsedRadius = parseFloat(radius as string);

        if (isNaN(parsedLat) || isNaN(parsedLng) || isNaN(parsedRadius)) {
          return res.status(400).json({ error: "Geospatial radius query parameters must be valid numbers" });
        }
      }

      const issues = await IssueService.getIssues(parsedLat, parsedLng, parsedRadius);
      return res.status(200).json(issues);
    } catch (error: any) {
      Logger.error("IssueController.getAllIssues failed", error);
      return res.status(500).json({ error: "Internal server error retrieving civic issues ledger" });
    }
  }

  static async submitIssue(req: Request, res: Response): Promise<Response> {
    try {
      const validationError = Validator.validateIssuePayload(req.body);
      if (validationError) {
        Logger.warn(`IssueController.submitIssue input validation rejected: ${validationError}`);
        return res.status(400).json({ error: validationError });
      }

      const newIssue = await IssueService.createIssue(req.body);
      return res.status(201).json(newIssue);
    } catch (error: any) {
      Logger.error("IssueController.submitIssue failed", error);
      return res.status(500).json({ error: "Internal server error registering new civic issue" });
    }
  }

  static async registerUpvote(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { email } = req.body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "A valid email is required to register an upvote" });
      }

      const updatedUpvotes = await IssueService.toggleUpvote(id, email);
      return res.status(200).json(updatedUpvotes);
    } catch (error: any) {
      Logger.error(`IssueController.registerUpvote failed for issue ID ${req.params.id}`, error);
      if (error.message === "Issue not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error handling upvote" });
    }
  }

  static async createComment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validationError = Validator.validateCommentPayload(req.body);
      if (validationError) {
        Logger.warn(`IssueController.createComment input validation rejected: ${validationError}`);
        return res.status(400).json({ error: validationError });
      }

      const newComment = await IssueService.addComment(id, req.body);
      return res.status(201).json(newComment);
    } catch (error: any) {
      Logger.error(`IssueController.createComment failed for issue ID ${req.params.id}`, error);
      if (error.message === "Issue not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error posting community comment" });
    }
  }

  static async changeStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, workerName } = req.body;

      const validStatuses = ["Reported", "Assigned", "In Progress", "Resolved"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of ${validStatuses.join(", ")}` });
      }

      const updatedIssue = await IssueService.updateStatus(id, status, workerName);
      return res.status(200).json(updatedIssue);
    } catch (error: any) {
      Logger.error(`IssueController.changeStatus failed for issue ID ${req.params.id}`, error);
      if (error.message === "Issue not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error patching status update" });
    }
  }
}
