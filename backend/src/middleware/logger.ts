import { Request, Response, NextFunction } from 'express';

/**
 * Production-ready structured JSON logger middleware.
 * Logs every request with method, path, status, duration, IP, and user agent.
 * In development, uses a compact format. In production, outputs JSON for log aggregation.
 */

const isProduction = process.env.NODE_ENV === 'production';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  path: string;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  userId?: string;
  contentLength?: string;
}

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function productionLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Capture the original end method to log after response is sent
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - start;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration,
      ip: getClientIp(req),
      userAgent: (req.headers['user-agent'] || '').substring(0, 200),
      userId: (req as any).user?.id,
      contentLength: res.getHeader('content-length') as string,
    };

    if (isProduction) {
      // Structured JSON for log aggregation (CloudWatch, Datadog, etc.)
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      // Compact dev-friendly format
      const color = entry.status >= 500 ? '\x1b[31m' : entry.status >= 400 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      console.log(`${color}${entry.method} ${entry.path} ${entry.status}${reset} ${duration}ms`);
    }

    return originalEnd.apply(this, args as [any, any, any]);
  } as any;

  next();
}

/**
 * Security event logger — logs important security events to stdout in structured format.
 * Designed to be picked up by SIEM/monitoring systems.
 */
export function logSecurityEvent(event: {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip?: string;
  userId?: string;
  metadata?: Record<string, any>;
}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'security',
    ...event,
  };

  if (isProduction) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    console.warn(`[SECURITY:${event.severity.toUpperCase()}] ${event.type}: ${event.message}`);
  }
}
