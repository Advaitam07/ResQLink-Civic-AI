import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  host: "0.0.0.0",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
  rateLimit: {
    apiWindowMs: 60000,
    apiMaxRequests: 120,
    writeWindowMs: 60000,
    writeMaxRequests: 30,
  },
  geoConfig: {
    duplicateMetersThreshold: 50,
    clusterMetersThreshold: 250,
  }
};
