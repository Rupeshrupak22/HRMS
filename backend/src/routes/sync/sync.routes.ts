import { Router, Request, Response } from 'express';
import { env } from '../../lib/env';
import { authenticate, authorize } from '../../middleware/auth';
import {
  verifyWebhookSignature,
  isTimestampValid,
  upsertEmployeeFromCrm,
  deactivateEmployeeFromCrm,
  runCrmSync,
  CrmEmployeeData,
  WebhookEvent,
} from './sync.service';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sync/employee — Webhook Receiver from CRM
// No auth middleware (external webhook), uses HMAC signature verification
// ─────────────────────────────────────────────────────────────────────────────

router.post('/employee', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Extract webhook headers
    const signature = req.headers['x-webhook-signature'] as string || '';
    const timestamp = req.headers['x-webhook-timestamp'] as string || '';
    const eventHeader = req.headers['x-webhook-event'] as string || '';

    // 1. Validate signature
    if (!env.CRM_WEBHOOK_SECRET) {
      console.error('[CRM Webhook] CRM_WEBHOOK_SECRET not configured');
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature, env.CRM_WEBHOOK_SECRET)) {
      console.warn('[CRM Webhook] Invalid signature received');
      await logWebhook('WEBHOOK', eventHeader || 'unknown', null, 'FAILED', 'Invalid signature');
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    // 2. Replay protection — reject if timestamp older than 5 minutes
    if (!timestamp || !isTimestampValid(timestamp)) {
      console.warn('[CRM Webhook] Stale timestamp:', timestamp);
      await logWebhook('WEBHOOK', eventHeader || 'unknown', null, 'FAILED', 'Stale timestamp (replay protection)');
      return res.status(401).json({ success: false, message: 'Webhook timestamp expired (replay protection)' });
    }

    // 3. Parse event and data
    const { event, data } = req.body as { event: WebhookEvent; timestamp: string; data: CrmEmployeeData };

    if (!event || !data || !data.id) {
      return res.status(400).json({ success: false, message: 'Missing event or data.id in payload' });
    }

    // 4. Process based on event type
    let action: string;

    switch (event) {
      case 'employee.created':
      case 'employee.updated': {
        const result = await upsertEmployeeFromCrm(data);
        action = result.action;
        break;
      }

      case 'employee.deactivated': {
        await deactivateEmployeeFromCrm(data.id);
        action = 'deactivated';
        break;
      }

      case 'document.created':
      case 'document.updated': {
        // Upsert employee with documents
        if (data.documents && Array.isArray(data.documents)) {
          const result = await upsertEmployeeFromCrm(data);
          action = `document_${result.action}`;
        } else {
          action = 'document_skipped';
        }
        break;
      }

      case 'document.deleted': {
        // Re-sync employee to reflect removed document
        if (data.id) {
          const result = await upsertEmployeeFromCrm(data);
          action = 'document_deleted';
        } else {
          action = 'document_delete_skipped';
        }
        break;
      }

      default: {
        console.warn('[CRM Webhook] Unknown event type:', event);
        await logWebhook('WEBHOOK', event, data.id, 'SKIPPED', `Unknown event: ${event}`);
        return res.status(200).json({ success: true, message: 'Event type not handled', event });
      }
    }

    // 5. Log success
    await logWebhook('WEBHOOK', event, data.id, 'SUCCESS');

    const processingTime = Date.now() - startTime;
    console.log(`[CRM Webhook] ${event} processed for ${data.id} (${action}) in ${processingTime}ms`);

    return res.status(200).json({
      success: true,
      message: `Employee ${action} successfully`,
      event,
      crmId: data.id,
      processingTimeMs: processingTime,
    });
  } catch (err: any) {
    const processingTime = Date.now() - startTime;
    console.error('[CRM Webhook] Processing error:', err.message);

    await logWebhook(
      'WEBHOOK',
      req.body?.event || 'unknown',
      req.body?.data?.id || null,
      'FAILED',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal error processing webhook',
      processingTimeMs: processingTime,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sync/run — Trigger manual full/incremental sync (protected)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/run', authenticate, authorize('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { updatedSince, includeInactive } = req.body as {
      updatedSince?: string;
      includeInactive?: boolean;
    };

    console.log(`[CRM Sync] Manual sync triggered${updatedSince ? ` (since ${updatedSince})` : ' (full)'}`);

    const result = await runCrmSync({ updatedSince, includeInactive });

    return res.json({
      success: true,
      message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      data: result,
    });
  } catch (err: any) {
    console.error('[CRM Sync] Manual sync failed:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Sync failed',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sync/status — Get sync status and recent logs (protected)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/status', authenticate, authorize('HR_ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), async (_req: AuthRequest, res: Response) => {
  try {
    const syncState = await prisma.crmSyncState.findUnique({ where: { id: 'singleton' } });
    const recentLogs = await prisma.crmSyncLog.findMany({
      orderBy: { processedAt: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      data: {
        state: syncState || { lastSyncAt: null, lastSyncStatus: 'NEVER', totalSynced: 0, errorCount: 0 },
        recentLogs,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sync/cron — Endpoint for cron job / external scheduler
// Secured by CRM_SYNC_API_KEY header
// ─────────────────────────────────────────────────────────────────────────────

router.post('/cron', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-hrms-api-key'] as string || req.headers['x-sync-api-key'] as string || '';

    if (!env.CRM_SYNC_API_KEY || apiKey !== env.CRM_SYNC_API_KEY) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // Get last sync time for incremental sync
    const syncState = await prisma.crmSyncState.findUnique({ where: { id: 'singleton' } });
    const updatedSince = syncState?.lastSyncAt?.toISOString();

    console.log(`[CRM Sync] Cron triggered${updatedSince ? ` (incremental since ${updatedSince})` : ' (full sync)'}`);

    const result = await runCrmSync({ updatedSince, includeInactive: true });

    return res.json({
      success: true,
      message: `Cron sync completed`,
      data: result,
    });
  } catch (err: any) {
    console.error('[CRM Sync] Cron sync failed:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Log webhook events
// ─────────────────────────────────────────────────────────────────────────────

async function logWebhook(
  syncType: string,
  event: string,
  crmEmployeeId: string | null,
  status: string,
  errorMessage?: string
) {
  try {
    await prisma.crmSyncLog.create({
      data: {
        syncType,
        event,
        crmEmployeeId,
        status,
        errorMessage: errorMessage || null,
      },
    });
  } catch (logErr) {
    console.error('[CRM Webhook] Failed to write log:', logErr);
  }
}

export default router;
