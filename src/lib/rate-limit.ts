import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── In-memory fallback (used when Upstash env vars are not set) ──────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

// ── Upstash-backed limiters (only created when env vars present) ──────────────
let ttsLimiter: Ratelimit | null = null;
let extractLimiter: Ratelimit | null = null;
let sttLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url === "" || token === "") return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

function getTtsLimiter(): Ratelimit | null {
  if (ttsLimiter) return ttsLimiter;
  const redis = getRedis();
  if (!redis) return null;
  ttsLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 TTS requests per 60s per user
    analytics: false,
    prefix: "sawti:tts",
  });
  return ttsLimiter;
}

function getExtractLimiter(): Ratelimit | null {
  if (extractLimiter) return extractLimiter;
  const redis = getRedis();
  if (!redis) return null;
  extractLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 extract requests per 60s per IP
    analytics: false,
    prefix: "sawti:extract",
  });
  return extractLimiter;
}

function getSttLimiter(): Ratelimit | null {
  if (sttLimiter) return sttLimiter;
  const redis = getRedis();
  if (!redis) return null;
  sttLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 STT requests per 60s per user
    analytics: false,
    prefix: "sawti:stt",
  });
  return sttLimiter;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export async function checkTtsRateLimit(userId: string): Promise<{ success: boolean; remaining: number }> {
  const limiter = getTtsLimiter();
  if (!limiter) return memoryRateLimit(`tts:${userId}`, 5, 60_000);
  const result = await limiter.limit(userId);
  return { success: result.success, remaining: result.remaining };
}

export async function checkExtractRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  const limiter = getExtractLimiter();
  if (!limiter) return memoryRateLimit(`extract:${ip}`, 10, 60_000);
  const result = await limiter.limit(ip);
  return { success: result.success, remaining: result.remaining };
}

export async function checkSttRateLimit(userId: string): Promise<{ success: boolean; remaining: number }> {
  const limiter = getSttLimiter();
  if (!limiter) return memoryRateLimit(`stt:${userId}`, 5, 60_000);
  const result = await limiter.limit(userId);
  return { success: result.success, remaining: result.remaining };
}
