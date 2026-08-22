import { Response } from 'express';

interface SSEClient {
  res: Response;
  deviceId: string;
  tokenVersion: number;
}

const userSessionClients = new Map<string, Set<SSEClient>>();

/**
 * Register a client for live SSE session invalidation events.
 */
export function registerSessionClient(
  userId: string,
  deviceId: string,
  tokenVersion: number,
  res: Response
): () => void {
  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const client: SSEClient = { res, deviceId, tokenVersion };

  if (!userSessionClients.has(userId)) {
    userSessionClients.set(userId, new Set());
  }
  userSessionClients.get(userId)!.add(client);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', deviceId })}\n\n`);

  const cleanup = () => {
    const set = userSessionClients.get(userId);
    if (set) {
      set.delete(client);
      if (set.size === 0) {
        userSessionClients.delete(userId);
      }
    }
  };

  return cleanup;
}

/**
 * Instantly broadcast FORCE_LOGOUT to any active sessions on other devices for this user.
 */
export function notifyOtherDevicesOfNewLogin(
  userId: string,
  activeDeviceId: string,
  activeTokenVersion: number
): void {
  const clients = userSessionClients.get(userId);
  if (!clients || clients.size === 0) return;

  const toRemove: SSEClient[] = [];

  for (const client of clients) {
    if (client.deviceId !== activeDeviceId || client.tokenVersion < activeTokenVersion) {
      try {
        client.res.write(
          `data: ${JSON.stringify({
            type: 'FORCE_LOGOUT',
            reason: 'You have been logged out because your account was signed in on another device.',
          })}\n\n`
        );
        client.res.end();
      } catch {}
      toRemove.push(client);
    }
  }

  for (const client of toRemove) {
    clients.delete(client);
  }

  if (clients.size === 0) {
    userSessionClients.delete(userId);
  }
}

// 25-second keep-alive ping for all active SSE connections to prevent timeouts
setInterval(() => {
  for (const [userId, clients] of userSessionClients.entries()) {
    const deadClients: SSEClient[] = [];
    for (const client of clients) {
      try {
        client.res.write(`data: ${JSON.stringify({ type: 'PING' })}\n\n`);
      } catch {
        deadClients.push(client);
      }
    }
    for (const dead of deadClients) {
      clients.delete(dead);
    }
    if (clients.size === 0) {
      userSessionClients.delete(userId);
    }
  }
}, 25 * 1000);
