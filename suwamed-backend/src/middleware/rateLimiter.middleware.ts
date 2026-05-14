import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // ~40 req/min per IP — comfortably above normal app browsing while still blocking scrapers
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Symptom checker is the only paid-per-call endpoint we expose to end users
// (OpenAI billed). IP-based limits are not enough — one user behind a shared
// NAT or a sticky IP could starve everyone else, and a malicious user could
// just disable Wi-Fi to get a fresh IP.
//
// Key the bucket on the authenticated userId when present, fall back to IP
// for unauthenticated requests (which the `protect` middleware blocks
// anyway — this is defence-in-depth).
export const symptomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request): string => {
    const uid = (req as any).user?.id;
    if (uid) return `user:${uid}`;
    return `ip:${req.ip ?? 'unknown'}`;
  },
  message: {
    success: false,
    message: 'Too many symptom checks today. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
