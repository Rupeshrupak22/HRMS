const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
const BASE = API_BASE + '/nitisha';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adyapan_access_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE}${endpoint}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  const result = await res.json();
  if (result && typeof result === 'object' && result.success && result.data !== undefined) {
    return result.data;
  }
  return result;
}

export const nitishaApi = {
  // Performance
  getPerformances: () => request('/performance'),
  createPerformance: (data: any) => request('/performance', { method: 'POST', body: JSON.stringify(data) }),
  updatePerformance: (id: string, data: any) => request(`/performance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePerformance: (id: string) => request(`/performance/${id}`, { method: 'DELETE' }),

  // Discipline
  getDiscipline: () => request('/discipline'),
  createDiscipline: (data: any) => request('/discipline', { method: 'POST', body: JSON.stringify(data) }),
  updateDiscipline: (id: string, data: any) => request(`/discipline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDiscipline: (id: string) => request(`/discipline/${id}`, { method: 'DELETE' }),

  // Relations
  getRelations: () => request('/relations'),
  createRelation: (data: any) => request('/relations', { method: 'POST', body: JSON.stringify(data) }),
  updateRelation: (id: string, data: any) => request(`/relations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRelation: (id: string) => request(`/relations/${id}`, { method: 'DELETE' }),

  // Daily Reports
  getDailyReports: () => request('/daily-reports'),
  createDailyReport: (data: any) => request('/daily-reports', { method: 'POST', body: JSON.stringify(data) }),
  updateDailyReport: (id: string, data: any) => request(`/daily-reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDailyReport: (id: string) => request(`/daily-reports/${id}`, { method: 'DELETE' }),
};
