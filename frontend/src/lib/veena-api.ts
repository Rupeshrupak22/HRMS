const BASE = 'http://localhost:4000/api/v1/veena-portal';

async function request(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as any },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

export const veenaApi = {
  getOnboarding: () => request('/onboarding'),
  createOnboarding: (data: any) => request('/onboarding', { method: 'POST', body: JSON.stringify(data) }),
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
