import SystemLog from '../models/SystemLog.model';
import logger from '../utils/logger';
import type { Request } from 'express';

// Best-effort audit logging — every admin/security-relevant action goes through
// here. Failures are logged to Winston and swallowed so we never block the
// originating request on the audit write.
export async function logEvent(
  action: string,
  opts: {
    actorId?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    req?: Request;
  } = {},
): Promise<void> {
  try {
    await SystemLog.create({
      userId: opts.actorId,
      action,
      details: {
        ...(opts.details ?? {}),
        ...(opts.targetId ? { targetId: opts.targetId } : {}),
      },
      ipAddress: opts.req?.ip,
      userAgent: opts.req?.headers['user-agent'],
    });
  } catch (err) {
    logger.warn(`[systemlog] failed to record ${action}: ${(err as Error).message}`);
  }
}

// GET /api/admin/system-logs — admin endpoint to read the audit trail.
// Exposed via the existing admin.routes — see admin.controller.ts.
