import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from './logger';

/**
 * Security Monitoring Middleware
 * Tracks suspicious patterns in-memory and triggers alerts when thresholds are breached.
 * Designed to detect brute-force, credential stuffing, and unusual access patterns.
 */

interface IpTracker {
  failedLogins: number;
  firstFailure: number;
  lastFailure: number;
  blocked: boolean;
  blockedUntil: number;
}

interface AlertThresholds {
  maxFailedLoginsPerIp: number;    // Per IP in the window
  maxFailedLoginsGlobal: number;   // Total across all IPs in the window
  windowMs: number;                // Time window for counting
  blockDurationMs: number;         // How long to block an IP
  alertCooldownMs: number;         // Don't re-alert within this window
}

const THRESHOLDS: AlertThresholds = {
  maxFailedLoginsPerIp: 10,         // 10 failures per IP in 15 min
  maxFailedLoginsGlobal: 50,        // 50 total failures = credential stuffing
  windowMs: 15 * 60 * 1000,         // 15 minutes
  blockDurationMs: 30 * 60 * 1000,  // Block IP for 30 min
  alertCooldownMs: 5 * 60 * 1000,   // Don't repeat alert for 5 min
};

// In-memory tracking (for single-instance; use Redis for multi-instance)
const ipTrackers = new Map<string, IpTracker>();
let globalFailedLogins = 0;
let globalWindowStart = Date.now();
let lastAlertTime = 0;

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, tracker] of ipTrackers.entries()) {
    if (now - tracker.lastFailure > THRESHOLDS.windowMs) {
      ipTrackers.delete(ip);
    }
    if (tracker.blocked && now > tracker.blockedUntil) {
      tracker.blocked = false;
    }
  }
  // Reset global counter if window expired
  if (now - globalWindowStart > THRESHOLDS.windowMs) {
    globalFailedLogins = 0;
    globalWindowStart = now;
  }
}, 10 * 60 * 1000);

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Record a failed login attempt and check thresholds
 */
export function recordFailedLogin(req: Request): void {
  const ip = getClientIp(req);
  const now = Date.now();

  // Per-IP tracking
  let tracker = ipTrackers.get(ip);
  if (!tracker || now - tracker.firstFailure > THRESHOLDS.windowMs) {
    tracker = { failedLogins: 0, firstFailure: now, lastFailure: now, blocked: false, blockedUntil: 0 };
    ipTrackers.set(ip, tracker);
  }

  tracker.failedLogins++;
  tracker.lastFailure = now;

  // Global tracking
  if (now - globalWindowStart > THRESHOLDS.windowMs) {
    globalFailedLogins = 0;
    globalWindowStart = now;
  }
  globalFailedLogins++;

  // Check per-IP threshold
  if (tracker.failedLogins >= THRESHOLDS.maxFailedLoginsPerIp && !tracker.blocked) {
    tracker.blocked = true;
    tracker.blockedUntil = now + THRESHOLDS.blockDurationMs;

    logSecurityEvent({
      type: 'BRUTE_FORCE_DETECTED',
      severity: 'high',
      message: `IP ${ip} blocked after ${tracker.failedLogins} failed login attempts in ${THRESHOLDS.windowMs / 60000} minutes`,
      ip,
      metadata: { failedAttempts: tracker.failedLogins, blockedUntilMs: tracker.blockedUntil },
    });
  }

  // Check global threshold (credential stuffing)
  if (globalFailedLogins >= THRESHOLDS.maxFailedLoginsGlobal && now - lastAlertTime > THRESHOLDS.alertCooldownMs) {
    lastAlertTime = now;
    logSecurityEvent({
      type: 'CREDENTIAL_STUFFING_SUSPECTED',
      severity: 'critical',
      message: `${globalFailedLogins} failed login attempts across all IPs in ${THRESHOLDS.windowMs / 60000} minutes — possible credential stuffing attack`,
      metadata: { totalFailures: globalFailedLogins, uniqueIps: ipTrackers.size },
    });
  }
}

/**
 * Check if an IP is currently blocked by the security monitor
 */
export function isIpBlocked(req: Request): boolean {
  const ip = getClientIp(req);
  const tracker = ipTrackers.get(ip);
  if (!tracker) return false;
  if (tracker.blocked && Date.now() < tracker.blockedUntil) return true;
  if (tracker.blocked && Date.now() >= tracker.blockedUntil) {
    tracker.blocked = false;
    return false;
  }
  return false;
}

/**
 * Middleware: Block requests from IPs that triggered security alerts
 */
export function securityGate(req: Request, res: Response, next: NextFunction): void {
  // Only apply to auth endpoints
  if (!req.path.includes('/auth/login')) {
    next();
    return;
  }

  if (isIpBlocked(req)) {
    const ip = getClientIp(req);
    logSecurityEvent({
      type: 'BLOCKED_REQUEST',
      severity: 'medium',
      message: `Blocked login attempt from IP ${ip} (currently rate-limited by security monitor)`,
      ip,
    });

    res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Your access has been temporarily restricted. Please try again later.',
    });
    return;
  }

  next();
}

/**
 * Record a successful login (resets IP tracker)
 */
export function recordSuccessfulLogin(req: Request): void {
  const ip = getClientIp(req);
  ipTrackers.delete(ip);
}

/**
 * Record unusual data access patterns
 */
export function recordDataAccess(req: Request, event: { action: string; recordCount?: number; userId?: string }): void {
  // Alert on bulk data access (potential exfiltration)
  if (event.recordCount && event.recordCount > 1000) {
    const ip = getClientIp(req);
    logSecurityEvent({
      type: 'BULK_DATA_ACCESS',
      severity: 'medium',
      message: `User ${event.userId || 'unknown'} accessed ${event.recordCount} records via ${event.action}`,
      ip,
      userId: event.userId,
      metadata: { action: event.action, recordCount: event.recordCount },
    });
  }
}

/**
 * Get current security monitoring stats (for admin dashboard)
 */
export function getSecurityStats() {
  const now = Date.now();
  const activeTrackers = Array.from(ipTrackers.entries())
    .filter(([_, t]) => now - t.lastFailure < THRESHOLDS.windowMs);

  return {
    trackedIps: activeTrackers.length,
    blockedIps: activeTrackers.filter(([_, t]) => t.blocked && now < t.blockedUntil).length,
    globalFailedLogins,
    windowStartedAt: new Date(globalWindowStart).toISOString(),
    thresholds: THRESHOLDS,
  };
}
