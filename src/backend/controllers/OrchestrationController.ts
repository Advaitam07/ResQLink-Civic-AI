import { Request, Response } from "express";
import { AgentOrchestrator } from "../orchestrator/AgentOrchestrator";
import { DatabaseService } from "../database/DatabaseService";
import { Logger } from "../utils/logger";

export class OrchestrationController {
  
  static async executeForensicAudit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      const issues = await DatabaseService.fetchAllIssues();
      const issue = issues.find(i => i.id === id);
      
      if (!issue) {
        return res.status(404).json({ error: `Civic issue ID ${id} not found` });
      }

      // Invoke Multi-Agent Forensic Investigation Pipeline
      const finalInvestigation = await AgentOrchestrator.runForensicInvestigation(issue, issues);

      // Commit investigation and append to timeline
      issue.investigation = finalInvestigation;
      issue.timeline = issue.timeline || [];
      issue.timeline.push({
        status: issue.status,
        description: `ResQ Commander orchestrated a 6-agent forensic investigation. Severity Score: ${finalInvestigation.severityScore}/10. Confidence: ${finalInvestigation.confidencePercentage}%.`,
        timestamp: new Date().toISOString(),
        actor: "Civic AI"
      });

      await DatabaseService.persistIssues(issues);
      Logger.info(`OrchestrationController: Successfully saved 6-agent investigation results for issue ${id}`);

      return res.status(200).json(finalInvestigation);
    } catch (error: any) {
      Logger.error(`OrchestrationController: Audit execution failed for issue ${req.params.id}`, error);
      return res.status(500).json({ error: error.message || "Failed to execute multi-agent AI forensic audit" });
    }
  }
}
