const API_BASE = 'http://localhost:4000/api/v1';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adyapan_access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'API request failed');
    }

    const result = await res.json();
    if (result && typeof result === 'object' && result.success && result.data !== undefined) {
      return result.data;
    }
    return result;
  } catch (error: any) {
    console.warn(`API call ${endpoint} error:`, error.message);
    throw error;
  }
}
