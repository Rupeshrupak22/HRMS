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

      // Detect force-logout (401 with FORCE_LOGOUT message)
      if (res.status === 401 && errorMessage === 'FORCE_LOGOUT') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:force-logout', {
            detail: { message: 'Session ended. You have been logged in on another device.' },
          }));
        }
        throw new Error('FORCE_LOGOUT');
      }

      // Detect deactivation or session compromise
      if (res.status === 401 && (errorMessage.includes('deactivated') || errorMessage.includes('compromised'))) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:force-logout', {
            detail: { message: errorMessage },
          }));
        }
        throw new Error(errorMessage);
      }

      throw new Error(errorMessage);
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
