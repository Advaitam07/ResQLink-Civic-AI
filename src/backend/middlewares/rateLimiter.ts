import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";
import { config } from "../config/config";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitCache = new Map<string, RateLimitRecord>();

export function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown-ip";
    const now = Date.now();
    const record = rateLimitCache.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitCache.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      Logger.warn(`Rate limit triggered for IP: ${ip} on endpoint ${req.originalUrl}`);
      return res.status(429).json({ 
        error: "Too many requests. Please slow down and try again later.",
        retryAfterMs: record.resetTime - now
      });
    }

    next();
  };
}

export const apiRateLimiter = rateLimiter(config.rateLimit.apiMaxRequests, config.rateLimit.apiWindowMs);
export const writeRateLimiter = rateLimiter(config.rateLimit.writeMaxRequests, config.rateLimit.writeWindowMs);
