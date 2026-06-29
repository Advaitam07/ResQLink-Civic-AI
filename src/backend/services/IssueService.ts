import { CivicIssue, CivicComment, TimelineEvent } from "../../types";
import { DatabaseService } from "../database/DatabaseService";
import { getDistanceMeters, encodeGeohash } from "../utils/geo";
import { detectDuplicate } from "../../utils/backendHelper";
import { eventBroker } from "../events/EventBroker";
import { Logger } from "../utils/logger";

export class IssueService {
  
  static async getIssues(lat?: number, lng?: number, radiusMeters?: number): Promise<CivicIssue[]> {
    const issues = await DatabaseService.fetchAllIssues();

    if (lat !== undefined && lng !== undefined && radiusMeters !== undefined) {
      Logger.info(`Geospatial search: [Lat: ${lat}, Lng: ${lng}], Radius: ${radiusMeters}m`);
      const filtered = issues.filter(issue => {
        const distance = getDistanceMeters(lat, lng, issue.location.lat, issue.location.lng);
        return distance <= radiusMeters;
      });
      Logger.info(`Geospatial search found ${filtered.length} issues`);
      return filtered;
    }

    return issues;
  }

  static async createIssue(payload: Partial<CivicIssue>): Promise<CivicIssue> {
    const issues = await DatabaseService.fetchAllIssues();

    const { 
      title, 
      description, 
      category, 
      severity, 
      communityImpact, 
      location, 
      reporter, 
      imageUrl, 
      recommendedActions 
    } = payload;

    const newIssue: CivicIssue = {
      id: `iss_${Date.now()}`,
      title: title!.trim(),
      description: description!.trim(),
      category: category!,
      status: "Reported",
      severity: severity!,
      communityImpact: communityImpact || "Awaiting AI impact estimation.",
      location: {
        lat: location!.lat,
        lng: location!.lng,
        address: location!.address.trim(),
        placeId: location!.placeId,
        geohash: location!.geohash || encodeGeohash(location!.lat, location!.lng)
      },
      reporter: reporter || { name: "Anonymous Citizen", email: "anonymous@resqlink.org" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl,
      recommendedActions: recommendedActions || ["Safety dispatch required."],
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      timeline: [
        {
          status: "Reported",
          description: "Civic report logged. Initial priority & safety metrics extracted.",
          timestamp: new Date().toISOString(),
          actor: "Civic AI"
        }
      ]
    };

    // Geospatial duplicate checking
    const dupCheck = detectDuplicate(newIssue, issues);
    if (dupCheck.isDuplicate && dupCheck.matchedId) {
      const matchedIssue = issues.find(i => i.id === dupCheck.matchedId);
      if (matchedIssue) {
        const groupId = matchedIssue.duplicateGroupId || `dup_${matchedIssue.id}`;
        matchedIssue.duplicateGroupId = groupId;
        newIssue.duplicateGroupId = groupId;

        newIssue.timeline.push({
          status: "Reported",
          description: `Duplicate detected (${dupCheck.confidenceScore}% confidence) of: "${matchedIssue.title}". Cluster group ${groupId} assigned.`,
          timestamp: new Date().toISOString(),
          actor: "Civic AI"
        });
        
        Logger.info(`Duplicate grouped: ${newIssue.id} under cluster ${groupId}`);
        eventBroker.publish("DuplicateDetected", { 
          id: newIssue.id, 
          baseId: matchedIssue.id, 
          clusterId: groupId, 
          confidence: dupCheck.confidenceScore 
        });
      }
    }

    issues.unshift(newIssue);
    await DatabaseService.persistIssues(issues);

    eventBroker.publish("MissionCreated", newIssue);

    // Reward reporter dynamics
    if (reporter && reporter.email) {
      await DatabaseService.creditUserPoints(reporter.email, 50, true, false);
    }

    return newIssue;
  }

  static async toggleUpvote(issueId: string, email: string): Promise<{ id: string; upvotes: number; upvotedBy: string[] }> {
    const issues = await DatabaseService.fetchAllIssues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const upvotedByList = issue.upvotedBy || [];
    const upvoteIndex = upvotedByList.indexOf(email);
    
    if (upvoteIndex > -1) {
      upvotedByList.splice(upvoteIndex, 1);
      issue.upvotedBy = upvotedByList;
      issue.upvotes = Math.max(0, (issue.upvotes || 1) - 1);
      Logger.info(`Upvote toggle-off for user ${email} on ${issueId}`);
    } else {
      upvotedByList.push(email);
      issue.upvotedBy = upvotedByList;
      issue.upvotes = (issue.upvotes || 0) + 1;
      await DatabaseService.creditUserPoints(email, 10, false, false);
      Logger.info(`Upvote added for user ${email} on ${issueId}`);
    }

    issue.updatedAt = new Date().toISOString();
    await DatabaseService.persistIssues(issues);

    return { id: issue.id, upvotes: issue.upvotes, upvotedBy: issue.upvotedBy };
  }

  static async addComment(issueId: string, commentPayload: { user: string; email: string; text: string }): Promise<CivicComment> {
    const issues = await DatabaseService.fetchAllIssues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const newComment: CivicComment = {
      id: `cmt_${Date.now()}`,
      user: commentPayload.user.trim(),
      userEmail: commentPayload.email.trim(),
      text: commentPayload.text.trim(),
      createdAt: new Date().toISOString()
    };

    issue.comments = issue.comments || [];
    issue.comments.push(newComment);
    issue.updatedAt = new Date().toISOString();
    
    await DatabaseService.persistIssues(issues);
    await DatabaseService.creditUserPoints(commentPayload.email, 15, false, false);

    return newComment;
  }

  static async updateStatus(issueId: string, status: string, workerName?: string): Promise<CivicIssue> {
    const issues = await DatabaseService.fetchAllIssues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const oldStatus = issue.status;
    issue.status = status as any;
    issue.updatedAt = new Date().toISOString();

    const actorName = workerName ? workerName.trim() : "Municipal Worker";
    issue.timeline = issue.timeline || [];
    issue.timeline.push({
      status: status as any,
      description: `Status changed from ${oldStatus} to ${status}. Update processed by ${actorName}.`,
      timestamp: new Date().toISOString(),
      actor: "Municipal Worker"
    });

    if (status === "Resolved" && issue.reporter && issue.reporter.email) {
      await DatabaseService.creditUserPoints(issue.reporter.email, 100, false, true);
      eventBroker.publish("MissionCompleted", issue);
    }

    await DatabaseService.persistIssues(issues);
    return issue;
  }
}
