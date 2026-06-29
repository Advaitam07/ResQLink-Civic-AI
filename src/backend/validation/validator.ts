import { CivicCategory, SeverityLevel } from "../../types";

const CATEGORIES: CivicCategory[] = ["Roads", "Sanitation", "Utilities", "Safety", "Environment"];
const SEVERITIES: SeverityLevel[] = ["Low", "Medium", "High", "Critical"];

export class Validator {
  static validateIssuePayload(body: any): string | null {
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

  static validateCommentPayload(body: any): string | null {
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

  static validateBase64Image(imageBase64: string, mimeType: string): string | null {
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
}
