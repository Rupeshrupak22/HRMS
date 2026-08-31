import https from 'https';

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || 'hrms-sync-key-2026';

// Persistent Keep-Alive HTTPS Agent for high-performance and zero connection drops
const crmAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 35000,
});

export interface CrmRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timeout?: number;
  retries?: number;
}

function singleCrmFetch(
  path: string,
  options: CrmRequestOptions = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve) => {
    const method = options.method || 'GET';
    const postData = options.body ? JSON.stringify(options.body) : null;
    const url = path.startsWith('http')
      ? path
      : `${CRM_BACKEND_URL}${path.startsWith('/') ? path : '/' + path}`;
    const parsedUrl = new URL(url);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
    };

    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(postData));
    }

    const req = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers,
        agent: crmAgent,
        family: 4, // Force IPv4 for Windows network stability
        timeout: options.timeout || 35000,
      },
      (res) => {
        let rawBody = '';
        res.on('data', (chunk) => {
          rawBody += chunk;
        });
        res.on('end', () => {
          let parsedData: any = null;
          try {
            parsedData = JSON.parse(rawBody);
          } catch {
            parsedData = rawBody;
          }
          const status = res.statusCode || 200;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            data: parsedData,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ok: false,
        status: 504,
        data: { success: false, message: 'CRM request timed out' },
      });
    });

    req.on('error', (err) => {
      resolve({
        ok: false,
        status: 500,
        data: { success: false, message: err.message || 'CRM connection failed' },
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Resilient wrapper with automatic retry on 504 / network glitch
export async function crmFetch(
  path: string,
  options: CrmRequestOptions = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const maxRetries = options.retries !== undefined ? options.retries : 2;
  let lastResult = await singleCrmFetch(path, options);

  if (!lastResult.ok && (lastResult.status === 504 || lastResult.status === 500) && maxRetries > 0) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await new Promise((r) => setTimeout(r, attempt * 500));
      lastResult = await singleCrmFetch(path, options);
      if (lastResult.ok) break;
    }
  }

  return lastResult;
}
