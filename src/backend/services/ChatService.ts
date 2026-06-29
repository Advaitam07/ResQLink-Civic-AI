import { GoogleGenAI } from "@google/genai";
import { DatabaseService } from "../database/DatabaseService";
import { calculateCommunityHealth } from "../../utils/backendHelper";
import { Logger } from "../utils/logger";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export class ChatService {
  
  static async processChat(messages: any[]): Promise<string> {
    const issues = await DatabaseService.fetchAllIssues();
    
    // Feed database context into CivicBot
    const issuesContext = issues.map(i => (
      `- [ID: ${i.id}] Title: "${i.title}" | Category: ${i.category} | Severity: ${i.severity} | Status: ${i.status} | Location: ${i.location.address} | Upvotes: ${i.upvotes}`
    )).slice(0, 10).join("\n");

    const systemInstruction = `You are CivicBot, the highly intelligent AI Concierge for ResQLink Civic AI. 
    Your goal is to guide citizens, report statuses, explain community health scores, and facilitate public action.

    Here is the live, active database of reported neighborhood issues:
    ${issuesContext}

    Guidelines:
    1. Ground all answers about reported problems in this database.
    2. Be extremely polite, practical, and constructive. Encourage upvoting, commenting, or creating new reports to earn points.
    3. Keep answers concise, highly professional, and easy to read.`;

    try {
      const recentMessages = messages.slice(-8);
      const contents = recentMessages.map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      if (contents.length === 0) {
        throw new Error("Empty message array supplied");
      }

      const lastPrompt = contents[contents.length - 1].parts[0].text;
      const history = contents.slice(0, -1);

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: { systemInstruction },
        history: history.map(h => ({
          role: h.role,
          parts: h.parts
        }))
      });

      const geminiRes = await chat.sendMessage({ message: lastPrompt });
      return geminiRes.text || "I am currently compiling status reports. Please ask again in a moment.";
    } catch (err: any) {
      Logger.info(`ChatService: Falling back to rule-based conversation flow due to: ${err.message || err}`);
      
      const lastUserMsgObj = messages[messages.length - 1];
      const prompt = (lastUserMsgObj?.text || "").toLowerCase();
      
      const activeCount = issues.filter(i => i.status !== "Resolved").length;
      const resolvedCount = issues.filter(i => i.status === "Resolved").length;

      if (prompt.includes("hello") || prompt.includes("hi ") || prompt.includes("hey") || prompt === "hi") {
        return "Hello! I am CivicBot, your local neighborhood concierge. How can I assist you with Mission District safety alerts, community scores, or checking up on active public works tickets today?";
      } 
      
      if (prompt.includes("score") || prompt.includes("health") || prompt.includes("grade") || prompt.includes("metric")) {
        const stats = calculateCommunityHealth(issues);
        return `The current Mission District Community Health Score is **${stats.score}** (Grade **${stats.grade}**). We have recorded a total of **${issues.length}** issues, with **${stats.totalActive}** active reports and **${stats.totalResolved}** successfully resolved incidents. Check the 'Health Score Analytics' tab for the full visual breakdown!`;
      } 
      
      if (prompt.includes("pothole") || prompt.includes("road") || prompt.includes("valencia")) {
        const pothole = issues.find(i => i.category === "Roads");
        if (pothole) {
          return `Yes, there is an active report: "**${pothole.title}**" at ${pothole.location.address} (ID: ${pothole.id}). It currently has **${pothole.upvotes} upvotes**. Dispatchers have tagged this with **${pothole.severity}** severity, and repairs are being scheduled!`;
        }
        return "I don't see any active road surface reports right now, but you can instantly create one in the 'Report Issue' tab!";
      } 
      
      if (prompt.includes("garbage") || prompt.includes("trash") || prompt.includes("sanitation")) {
        const trash = issues.find(i => i.category === "Sanitation");
        if (trash) {
          return `We are tracking a sanitation concern: "**${trash.title}**" at ${trash.location.address} (ID: ${trash.id}). Status is **${trash.status}** with **${trash.severity}** priority. Environmental teams are active on site.`;
        }
        return "There are no active illegal dumping issues registered right now. If you see any, you can report them with photos to earn points!";
      } 
      
      if (prompt.includes("point") || prompt.includes("reward") || prompt.includes("leaderboard")) {
        return "You can earn citizen loyalty points by contributing to neighborhood safety! You get **+50 pts** for submitting any valid report, **+15 pts** for adding helpful comments, and **+10 pts** for upvoting. Top contributors are showcased in the 'Leaderboard' tab!";
      }

      return `I am here to assist with municipal reports in the Mission District! We have **${activeCount}** active reports and **${resolvedCount}** resolved cases. What can I check for you today?`;
    }
  }
}
export default ChatService;
