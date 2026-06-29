import { Router } from "express";
import { IssueController } from "../controllers/IssueController";
import { AIController } from "../controllers/AIController";
import { LeaderboardController } from "../controllers/LeaderboardController";
import { OrchestrationController } from "../controllers/OrchestrationController";
import { MeshController } from "../controllers/MeshController";
import { ResourceController } from "../controllers/ResourceController";
import { CommunityController } from "../controllers/CommunityController";
import { apiRateLimiter, writeRateLimiter } from "../middlewares/rateLimiter";

const router = Router();

// --- CORE ISSUES ENDPOINTS ---
router.get("/issues", apiRateLimiter, IssueController.getAllIssues);
router.post("/issues", writeRateLimiter, IssueController.submitIssue);
router.post("/issues/:id/upvote", writeRateLimiter, IssueController.registerUpvote);
router.post("/issues/:id/comments", writeRateLimiter, IssueController.createComment);
router.post("/issues/:id/status", writeRateLimiter, IssueController.changeStatus);

// --- LEADERBOARD ENDPOINTS ---
router.get("/users/leaderboard", apiRateLimiter, LeaderboardController.getLeaderboardList);

// --- LOCAL OFFLINE MESH ENDPOINTS ---
router.get("/mesh/messages", apiRateLimiter, MeshController.getMessages);
router.post("/mesh/messages", writeRateLimiter, MeshController.postMessage);
router.get("/mesh/nodes", apiRateLimiter, MeshController.getNodes);
router.post("/mesh/nodes/register", writeRateLimiter, MeshController.registerNode);

// --- GEMINI POWERED ENDPOINTS ---
router.post("/gemini/analyze-image", writeRateLimiter, AIController.analyzeImageUpload);
router.get("/gemini/health-score", apiRateLimiter, AIController.checkHealthScore);
router.post("/gemini/chat", writeRateLimiter, AIController.conversationalChat);
router.post("/gemini/disaster-news", writeRateLimiter, AIController.generateDisasterNewsBriefing);

// --- MULTI-AGENT ORCHESTRATOR ENDPOINT ---
router.post("/issues/:id/investigate", writeRateLimiter, OrchestrationController.executeForensicAudit);

// --- EMERGENCY RESOURCE MATRIX ENDPOINTS ---
router.get("/resources/alerts", apiRateLimiter, ResourceController.getAlerts);
router.post("/resources/alerts", writeRateLimiter, ResourceController.createAlert);

// --- COMMUNITY MUTUAL AID & LIFE-LINE SAFEGUARD ENDPOINTS ---
router.get("/community/aid", apiRateLimiter, CommunityController.getMutualAidRequests);
router.post("/community/aid", writeRateLimiter, CommunityController.createMutualAidRequest);
router.post("/community/aid/:id/fulfill", writeRateLimiter, CommunityController.fulfillMutualAidRequest);
router.get("/community/safeguard", apiRateLimiter, CommunityController.getFinalSafeguard);
router.post("/community/safeguard", writeRateLimiter, CommunityController.saveFinalSafeguard);

export default router;
