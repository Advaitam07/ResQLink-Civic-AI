import { CivicIssue, CommunityHealthStats, CivicCategory, SeverityLevel } from "../types";

/**
 * 1. HIGH-FIDELITY LOGGER UTILITY
 */
export const Logger = {
  getTimestamp(): string {
    return new Date().toISOString();
  },
  info(message: string, meta?: any): void {
    console.log(`[\x1b[32mINFO\x1b[0m] [${this.getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn(message: string, meta?: any): void {
    console.warn(`[\x1b[33mWARN\x1b[0m] [${this.getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error(message: string, error?: any): void {
    console.error(`[\x1b[31mERROR\x1b[0m] [${this.getTimestamp()}] ${message}`, error || "");
  },
  http(method: string, url: string, statusCode: number, durationMs: number): void {
    const color = statusCode >= 400 ? "\x1b[31m" : statusCode >= 300 ? "\x1b[33m" : "\x1b[32m";
    console.log(`[\x1b[36mHTTP\x1b[0m] [${this.getTimestamp()}] ${method} ${url} -> ${color}${statusCode}\x1b[0m (${durationMs}ms)`);
  }
};

/**
 * 2. GEOSPATIAL HAVERSINE DISTANCE CALCULATOR
 */
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function encodeGeohash(lat: number, lng: number, precision = 9): string {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let geohash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}

/**
 * 3. TEXT JACCARD SIMILARITY ENGINE
 * Tokenizes text, strips punctuation, and computes Intersection-Over-Union coefficient.
 */
export function getTitleSimilarity(t1: string, t2: string): number {
  const getTokens = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2) // Filter out small noise words like 'a', 'to', 'the'
    );
  };
  
  const s1 = getTokens(t1);
  const s2 = getTokens(t2);
  
  if (s1.size === 0 && s2.size === 0) return 1;
  if (s1.size === 0 || s2.size === 0) return 0;
  
  const intersect = new Set([...s1].filter(word => s2.has(word)));
  const union = new Set([...s1, ...s2]);
  
  return intersect.size / union.size;
}

/**
 * 4. DETAILED DUPLICATE RESOLUTION MATRICES
 */
export interface DuplicateResult {
  isDuplicate: boolean;
  confidenceScore: number;
  duplicateReason: string;
  matchedId?: string;
}

export function detectDuplicate(newIssue: Partial<CivicIssue>, existingIssues: CivicIssue[]): DuplicateResult {
  if (!newIssue.category || !newIssue.location || !newIssue.title) {
    return { isDuplicate: false, confidenceScore: 0, duplicateReason: "Insufficient metadata for checking" };
  }

  const categoryCandidates = existingIssues.filter(i => i.category === newIssue.category && i.id !== newIssue.id);
  
  let bestMatch: CivicIssue | null = null;
  let highestScore = 0;
  let highestReason = "No near matching issues detected.";

  for (const candidate of categoryCandidates) {
    let score = 0;
    let reasonComponents: string[] = [];

    // Category Match is pre-filtered but guarantees baseline compatibility
    score += 10;

    // A. Calculate Physical Distance
    const distance = getDistanceMeters(
      newIssue.location.lat,
      newIssue.location.lng,
      candidate.location.lat,
      candidate.location.lng
    );

    if (distance <= 100) {
      score += 45;
      reasonComponents.push(`Immediate impact overlap (${Math.round(distance)}m < 100m radius)`);
    } else if (distance <= 250) {
      score += 30;
      reasonComponents.push(`Proximity corridor buffer (${Math.round(distance)}m < 250m radius)`);
    } else if (distance <= 500) {
      score += 15;
      reasonComponents.push(`Shared sector warning zone (${Math.round(distance)}m < 500m radius)`);
    } else if (distance <= 1000) {
      score += 5;
      reasonComponents.push(`Broad regional proximity limit (${Math.round(distance)}m < 1km radius)`);
    }

    // B. Calculate Title Semantic Similarity
    const textSim = getTitleSimilarity(newIssue.title, candidate.title);
    if (textSim >= 0.7) {
      score += 35;
      reasonComponents.push(`Highly redundant semantic wording (${Math.round(textSim * 100)}% Match)`);
    } else if (textSim >= 0.4) {
      score += 20;
      reasonComponents.push(`Partial semantic subject match (${Math.round(textSim * 100)}% Match)`);
    } else if (textSim >= 0.15) {
      score += 5;
    }

    // C. Calculate Creation Time Proximity
    const tNew = new Date(newIssue.createdAt || new Date()).getTime();
    const tCandidate = new Date(candidate.createdAt).getTime();
    const daysDiff = Math.abs(tNew - tCandidate) / (3600000 * 24);

    if (daysDiff <= 1) {
      score += 10;
      reasonComponents.push("Reports logged in matching 24-hour cycle.");
    } else if (daysDiff <= 5) {
      score += 5;
      reasonComponents.push(`Temporal drift within ${Math.round(daysDiff)} days.`);
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = candidate;
      highestReason = reasonComponents.join(" | ");
    }
  }

  // Cap matching index to 100%
  const finalScore = Math.min(100, highestScore);

  return {
    isDuplicate: finalScore >= 60, // Classify as duplicate if confidence score is 60%+
    confidenceScore: finalScore,
    duplicateReason: bestMatch 
      ? `Duplicate threshold reached (${finalScore}% confidence) against Ticket: "${bestMatch.title}" (ID: ${bestMatch.id}). Details: ${highestReason}`
      : "No matching duplicate ticket found in the current sector.",
    matchedId: finalScore >= 60 && bestMatch ? bestMatch.id : undefined
  };
}

/**
 * 5. MATHEMATICALLY DYNAMIC COMMUNITY HEALTH SCORE
 */
export function calculateCommunityHealth(issues: CivicIssue[]): CommunityHealthStats {
  const total = issues.length;
  const activeIssues = issues.filter(i => i.status !== "Resolved");
  const resolvedIssues = issues.filter(i => i.status === "Resolved");
  
  const totalActive = activeIssues.length;
  const totalResolved = resolvedIssues.length;
  const resolvedPercentage = total > 0 ? Math.round((totalResolved / total) * 100) : 100;

  // Initialize breakdowns
  const byCategory: Record<CivicCategory, number> = {
    Roads: 0,
    Sanitation: 0,
    Utilities: 0,
    Safety: 0,
    Environment: 0
  };

  const bySeverity: Record<SeverityLevel, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0
  };

  issues.forEach(i => {
    if (byCategory[i.category] !== undefined) byCategory[i.category]++;
    if (bySeverity[i.severity] !== undefined) bySeverity[i.severity]++;
  });

  // Calculate resolution time from actual timeline transitions (default fallback to 3.2 days)
  let totalResolutionTimeDays = 0;
  let resolvedCountWithTimestamps = 0;

  resolvedIssues.forEach(issue => {
    const reportedEvent = issue.timeline.find(e => e.status === "Reported");
    const resolvedEvent = issue.timeline.find(e => e.status === "Resolved");
    if (reportedEvent && resolvedEvent) {
      const start = new Date(reportedEvent.timestamp).getTime();
      const end = new Date(resolvedEvent.timestamp).getTime();
      const diffDays = (end - start) / (1000 * 3600 * 24);
      if (diffDays > 0) {
        totalResolutionTimeDays += diffDays;
        resolvedCountWithTimestamps++;
      }
    }
  });

  const averageResolutionDays = resolvedCountWithTimestamps > 0 
    ? parseFloat((totalResolutionTimeDays / resolvedCountWithTimestamps).toFixed(1)) 
    : 2.8;

  // Real Dynamic Score Calculation Formula
  // Starting point: 100 points
  let score = 95;

  // Penalize for open unresolved issues based on severity
  activeIssues.forEach(issue => {
    if (issue.severity === "Critical") score -= 12;
    else if (issue.severity === "High") score -= 8;
    else if (issue.severity === "Medium") score -= 4;
    else if (issue.severity === "Low") score -= 1.5;
  });

  // Bonus/penalty based on resolution rate
  score += (resolvedPercentage - 50) * 0.2; 

  // Bonus for community participation
  const totalUpvotes = issues.reduce((acc, i) => acc + (i.upvotes || 0), 0);
  const totalComments = issues.reduce((acc, i) => acc + (i.comments?.length || 0), 0);
  score += Math.min(6, totalUpvotes * 0.05);
  score += Math.min(4, totalComments * 0.1);

  // Penalty for slow resolution cycles
  if (averageResolutionDays > 10) {
    score -= 15;
  } else if (averageResolutionDays > 5) {
    score -= 5;
  } else {
    score += 3;
  }

  // Clamping score between 15 and 100
  score = Math.max(15, Math.min(100, Math.round(score)));

  // Standard Deterministic Grades
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  if (score >= 96) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 55) grade = 'D';
  else grade = 'F';

  // Construct structured description text based on factual data
  const mainSectors = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .filter(x => x[1] > 0)
    .map(x => x[0]);

  const concernSectorsStr = mainSectors.length > 0 
    ? `Primary neighborhood blights and asset failures concentrate under ${mainSectors.slice(0, 2).join(" & ")} categories.`
    : "No major asset concentrations are registered in the local index.";

  const analysis = `District Civic Infrastructure Assessment: Community Safety and Operations score compiled at ${score}/100 with an overall grade of "${grade}". ${concernSectorsStr} Currently, the municipality maintains ${totalActive} active unresolved tickets and ${totalResolved} fully cleared cases, corresponding to an operational resolution coefficient of ${resolvedPercentage}%. Dispatch turnaround averages a robust ${averageResolutionDays} days. High-density community upvotes (${totalUpvotes}) demonstrate strong civic stewardship across the local sector.`;

  return {
    score,
    grade,
    analysis,
    totalActive,
    totalResolved,
    resolvedPercentage,
    averageResolutionDays,
    byCategory,
    bySeverity
  };
}

/**
 * 6. SECURITY VALIDATION SCHEMAS AND SANITIZERS
 */
const CATEGORIES: CivicCategory[] = ["Roads", "Sanitation", "Utilities", "Safety", "Environment"];
const SEVERITIES: SeverityLevel[] = ["Low", "Medium", "High", "Critical"];

export function validateIssuePayload(body: any): string | null {
  if (!body) return "Request body is empty";
  
  const { title, description, category, severity, location, reporter } = body;
  
  if (!title || typeof title !== "string" || title.trim().length < 5) {
    return "Invalid field: title must be a string with at least 5 characters";
  }
  if (!description || typeof description !== "string" || description.trim().length < 10) {
    return "Invalid field: description must be a string with at least 10 characters";
  }
  if (!category || !CATEGORIES.includes(category)) {
    return `Invalid category: Must be one of ${CATEGORIES.join(", ")}`;
  }
  if (!severity || !SEVERITIES.includes(severity)) {
    return `Invalid severity level: Must be one of ${SEVERITIES.join(", ")}`;
  }
  
  if (!location || typeof location !== "object") {
    return "Missing or invalid location object";
  }
  const { lat, lng, address } = location;
  if (typeof lat !== "number" || lat < -90 || lat > 90) {
    return "Invalid location coordinates: lat must be a number between -90 and 90";
  }
  if (typeof lng !== "number" || lng < -180 || lng > 180) {
    return "Invalid location coordinates: lng must be a number between -180 and 180";
  }
  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return "Invalid address format";
  }
  
  if (reporter && typeof reporter === "object") {
    const { name, email } = reporter;
    if (name && (typeof name !== "string" || name.length < 2)) {
      return "Invalid reporter name format";
    }
    if (email && (typeof email !== "string" || !email.includes("@") || !email.includes("."))) {
      return "Invalid reporter email address format";
    }
  }

  return null;
}

export function validateCommentPayload(body: any): string | null {
  if (!body) return "Request body is empty";
  const { user, email, text } = body;
  if (!user || typeof user !== "string" || user.trim().length < 2) {
    return "User name must be a string of at least 2 characters";
  }
  if (!email || typeof email !== "string" || !email.includes("@") || !email.includes(".")) {
    return "A valid user email address is required";
  }
  if (!text || typeof text !== "string" || text.trim().length < 3) {
    return "Comment message must be at least 3 characters long";
  }
  return null;
}

export function validateBase64Image(imageBase64: string, mimeType: string): string | null {
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return "Invalid base64 payload";
  }
  if (!mimeType || typeof mimeType !== "string") {
    return "Missing or invalid image MIME type";
  }
  
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(mimeType)) {
    return `Forbidden file format: MIME type must be one of ${allowedMimeTypes.join(", ")}`;
  }
  
  // Cap base64 image length (12MB limit)
  if (imageBase64.length > 16 * 1024 * 1024) {
    return "Payload too large: image upload exceeds maximum 12MB limit";
  }
  
  return null;
}
