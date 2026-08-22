const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

/**
 * Get CSRF token from cookie (set by backend)
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adyapan_access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      cache: 'no-store',
      credentials: 'include',
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const errorMessage = err.message || 'API request failed';

      // Detect force-logout only when another device logs in (explicit FORCE_LOGOUT)
      if (res.status === 401 && (errorMessage === 'FORCE_LOGOUT' || errorMessage.includes('FORCE_LOGOUT') || err.forceLogout || err.code === 'FORCE_LOGOUT')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:force-logout', {
            detail: {
              message: 'Session ended. You have been logged in on another device.'
            },
          }));
        }
        const error = new Error('FORCE_LOGOUT');
        (error as any).code = 'FORCE_LOGOUT';
        (error as any).forceLogout = true;
        throw error;
      }

      const error = new Error(errorMessage);
      (error as any).code = err.code;
      (error as any).remainingAttempts = err.remainingAttempts;
      (error as any).lockoutMinutes = err.lockoutMinutes;
      (error as any).status = res.status;
      throw error;
    }

    const result = await res.json();
    if (result && typeof result === 'object' && result.success && result.data !== undefined) {
      return result.data;
    }
    return result;
  } catch (error: any) {
    if (error.message !== 'FORCE_LOGOUT') {
      console.warn(`API call ${endpoint} error:`, error.message);
    }
    throw error;
  }
}
