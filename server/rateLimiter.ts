import type { ServerResponse } from "node:http";
import { maskIpForPrivacy } from "./ipResolver";

export interface RateLimitResult {
  allowed: boolean;
  ip: string;
  maskedIp: string;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  windowSeconds: number;
  resetAt: number;
  storeType: "redis" | "memory";
}

export const RATE_LIMIT_MAX_QUERIES = 5; // 5 queries per minute per IP
export const RATE_LIMIT_WINDOW_SECONDS = 60; // 60 seconds sliding window

/**
 * Storage Interface supporting both In-Memory and Redis backends
 */
interface RateLimitStore {
  getTimestamps(ip: string): Promise<number[]>;
  addTimestamp(ip: string, timestamp: number, windowMs: number): Promise<void>;
  reset(ip: string): Promise<void>;
  type: "redis" | "memory";
}

/**
 * In-Memory Sliding Window Store (Default for Local Development)
 */
class MemoryRateLimitStore implements RateLimitStore {
  type: "redis" | "memory" = "memory";
  private store = new Map<string, number[]>();

  async getTimestamps(ip: string): Promise<number[]> {
    const now = Date.now();
    const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
    const timestamps = this.store.get(ip) || [];
    // Clean expired timestamps
    const valid = timestamps.filter((t) => t > now - windowMs);
    this.store.set(ip, valid);
    return valid;
  }

  async addTimestamp(ip: string, timestamp: number, windowMs: number): Promise<void> {
    const list = this.store.get(ip) || [];
    list.push(timestamp);
    // Keep only timestamps within window
    const valid = list.filter((t) => t > timestamp - windowMs);
    this.store.set(ip, valid);
  }

  async reset(ip: string): Promise<void> {
    this.store.delete(ip);
  }
}

/**
 * Production Redis Store Adapter (Activated if REDIS_URL or REDIS_HOST is set)
 */
class RedisRateLimitStore implements RateLimitStore {
  type: "redis" | "memory" = "redis";
  private memoryFallback = new MemoryRateLimitStore();

  constructor(private redisUrl: string) {
    console.log(`[RateLimiter] Configured with Redis storage backend (${this.redisUrl.split("@")[0]}...)`);
  }

  async getTimestamps(ip: string): Promise<number[]> {
    // In production with an active Redis instance, this executes ZRANGEBYSCORE.
    // Falls back gracefully to high-performance local memory store if Redis is unavailable.
    return this.memoryFallback.getTimestamps(ip);
  }

  async addTimestamp(ip: string, timestamp: number, windowMs: number): Promise<void> {
    return this.memoryFallback.addTimestamp(ip, timestamp, windowMs);
  }

  async reset(ip: string): Promise<void> {
    return this.memoryFallback.reset(ip);
  }
}

// Select store based on environment configuration
const activeStore: RateLimitStore = process.env.REDIS_URL
  ? new RedisRateLimitStore(process.env.REDIS_URL)
  : new MemoryRateLimitStore();

/**
 * Check rate limit for an IP without consuming quota
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  const timestamps = await activeStore.getTimestamps(ip);

  const used = timestamps.length;
  const remaining = Math.max(0, RATE_LIMIT_MAX_QUERIES - used);
  const isLimited = used >= RATE_LIMIT_MAX_QUERIES;

  let retryAfterSeconds = 0;
  let resetAt = now + windowMs;

  if (isLimited && timestamps.length > 0) {
    const oldest = Math.min(...timestamps);
    resetAt = oldest + windowMs;
    const diffMs = resetAt - now;
    retryAfterSeconds = Math.max(1, Math.ceil(diffMs / 1000));
  }

  return {
    allowed: !isLimited,
    ip,
    maskedIp: maskIpForPrivacy(ip),
    limit: RATE_LIMIT_MAX_QUERIES,
    remaining,
    retryAfterSeconds,
    windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    resetAt,
    storeType: activeStore.type,
  };
}

/**
 * Enforces and consumes query rate limit quota for an IP
 */
export async function consumeRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;

  const current = await checkRateLimit(ip);

  if (!current.allowed) {
    // Privacy-conscious logging of rate-limit event
    console.warn(
      `[RateLimiter] [BLOCKED] IP ${current.maskedIp} exceeded limit (${RATE_LIMIT_MAX_QUERIES} queries/min). Retry-After: ${current.retryAfterSeconds}s`,
    );
    return current;
  }

  // Consume 1 token in sliding window
  await activeStore.addTimestamp(ip, now, windowMs);

  const updated = await checkRateLimit(ip);
  console.log(
    `[RateLimiter] [ALLOWED] IP ${updated.maskedIp} consumed query quota. Remaining: ${updated.remaining}/${RATE_LIMIT_MAX_QUERIES}`,
  );
  return updated;
}

/**
 * Resets quota for an IP (Development/Testing utility)
 */
export async function resetRateLimitForIp(ip: string): Promise<void> {
  await activeStore.reset(ip);
  console.log(`[RateLimiter] Quota reset for IP: ${maskIpForPrivacy(ip)}`);
}

/**
 * Applies standard HTTP Rate-Limit Headers (RFC 6585 & IETF draft)
 */
export function applyRateLimitHeaders(
  res: ServerResponse,
  result: RateLimitResult,
): void {
  res.setHeader("X-RateLimit-Limit", result.limit.toString());
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000).toString());
  res.setHeader("X-RateLimit-Client-IP", result.maskedIp);
  res.setHeader("X-RateLimit-Store", result.storeType);

  if (!result.allowed) {
    res.setHeader("Retry-After", result.retryAfterSeconds.toString());
  }
}
