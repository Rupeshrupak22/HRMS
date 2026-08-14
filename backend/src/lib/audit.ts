import prisma from './prisma';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_LOCKED'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_DELETED'
  | 'ROLE_CHANGE'
  | 'PAYROLL_PROCESSED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'REPORT_SUBMITTED'
  | 'ADMIN_SEED'
  | 'DATA_EXPORT';

interface AuditEntry {
  action: AuditAction;
  module?: string;
  userId?: string;
  userEmail?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Log an audit event to the database.
 * Non-blocking — failures are logged to console but don't disrupt the request.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    // Determine module from action prefix
    const module = entry.module || deriveModule(entry.action);

    await prisma.auditLog.create({
      data: {
        action: entry.action,
        module,
        userId: entry.userId || null,
        userEmail: entry.userEmail || null,
        recordId: entry.targetId || null,
        ipAddress: entry.ipAddress || null,
        details: JSON.stringify({
          targetType: entry.targetType,
          metadata: entry.metadata,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    // Non-blocking — log to console for monitoring
    console.error('[AUDIT] Failed to write audit log:', {
      action: entry.action,
      userEmail: entry.userEmail,
      error: (err as Error).message,
    });
  }
}

/**
 * Derive module name from action
 */
function deriveModule(action: string): string {
  if (action.startsWith('LOGIN') || action.startsWith('LOGOUT') || action === 'ACCOUNT_LOCKED' || action === 'PASSWORD_CHANGE') {
    return 'AUTH';
  }
  if (action.startsWith('EMPLOYEE')) return 'EMPLOYEE';
  if (action.startsWith('PAYROLL')) return 'PAYROLL';
  if (action.startsWith('DOCUMENT')) return 'DOCUMENT';
  if (action.startsWith('REPORT')) return 'REPORT';
  if (action.startsWith('ROLE')) return 'ADMIN';
  if (action === 'ADMIN_SEED') return 'ADMIN';
  if (action === 'DATA_EXPORT') return 'EXPORT';
  return 'SYSTEM';
}

/**
 * Extract client IP from request (handles proxies)
 */
export function getClientIp(req: any): string {
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
