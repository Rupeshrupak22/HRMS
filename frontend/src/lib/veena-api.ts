const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
const BASE = API_BASE + '/veena-portal';

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('adyapan_access_token') || localStorage.getItem('token')
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Add CSRF token for state-changing requests (POST, PUT, DELETE) on Live / Production
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || `API error: ${res.statusText}`);
  }

  const result = await res.json();
  if (result && typeof result === 'object' && result.success && result.data !== undefined) {
    return result.data;
  }
  return result;
}

export const veenaApi = {
  // Recruitment Candidates / Hiring Pipeline
  getRecruitment: () => request('/recruitment'),
  createRecruitment: (data: any) => request('/recruitment', { method: 'POST', body: JSON.stringify(data) }),
  createRecruitmentBulk: (data: any[]) => request('/recruitment/bulk', { method: 'POST', body: JSON.stringify(data) }),
  updateRecruitment: (id: string, data: any) => request(`/recruitment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecruitment: (id: string) => request(`/recruitment/${id}`, { method: 'DELETE' }),

  // Pure Employee Onboarding Pipeline
  getOnboarding: () => request('/onboarding'),
  createOnboarding: (data: any) => request('/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  createOnboardingBulk: (data: any[]) => request('/onboarding/bulk', { method: 'POST', body: JSON.stringify(data) }),
  updateOnboarding: (id: string, data: any) => request(`/onboarding/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOnboarding: (id: string) => request(`/onboarding/${id}`, { method: 'DELETE' }),

  getDropouts: () => request('/dropouts'),
  createDropout: (data: any) => request('/dropouts', { method: 'POST', body: JSON.stringify(data) }),
  updateDropout: (id: string, data: any) => request(`/dropouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDropout: (id: string) => request(`/dropouts/${id}`, { method: 'DELETE' }),

  getDailyReports: () => request('/daily-reports'),
  createDailyReport: (data: any) => request('/daily-reports', { method: 'POST', body: JSON.stringify(data) }),
  updateDailyReport: (id: string, data: any) => request(`/daily-reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDailyReport: (id: string) => request(`/daily-reports/${id}`, { method: 'DELETE' }),
};
