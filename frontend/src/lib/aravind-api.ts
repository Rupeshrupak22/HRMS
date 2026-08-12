const BASE = 'http://localhost:4000/api/v1/aravind';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adyapan_access_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE}${endpoint}`, {
    cache: 'no-store',
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

export const aravindApi = {
  // Retention
  getRetention: () => request('/retention'),
  createRetention: (data: any) => request('/retention', { method: 'POST', body: JSON.stringify(data) }),
  updateRetention: (id: string, data: any) => request(`/retention/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRetention: (id: string) => request(`/retention/${id}`, { method: 'DELETE' }),

  // Resignation
  getResignation: () => request('/resignation'),
  createResignation: (data: any) => request('/resignation', { method: 'POST', body: JSON.stringify(data) }),
  updateResignation: (id: string, data: any) => request(`/resignation/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResignation: (id: string) => request(`/resignation/${id}`, { method: 'DELETE' }),

  // Exit Clearance
  getExitClearance: () => request('/exit-clearance'),
  createExitClearance: (data: any) => request('/exit-clearance', { method: 'POST', body: JSON.stringify(data) }),
  updateExitClearance: (id: string, data: any) => request(`/exit-clearance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExitClearance: (id: string) => request(`/exit-clearance/${id}`, { method: 'DELETE' }),

  // F&F
  getFnF: () => request('/fnf'),
  createFnF: (data: any) => request('/fnf', { method: 'POST', body: JSON.stringify(data) }),
  updateFnF: (id: string, data: any) => request(`/fnf/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFnF: (id: string) => request(`/fnf/${id}`, { method: 'DELETE' }),

  // Complaints
  getComplaints: () => request('/complaints'),
  createComplaint: (data: any) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: string, data: any) => request(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComplaint: (id: string) => request(`/complaints/${id}`, { method: 'DELETE' }),

  // Exit Interview
  getExitInterview: () => request('/exit-interview'),
  createExitInterview: (data: any) => request('/exit-interview', { method: 'POST', body: JSON.stringify(data) }),
  updateExitInterview: (id: string, data: any) => request(`/exit-interview/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExitInterview: (id: string) => request(`/exit-interview/${id}`, { method: 'DELETE' }),

  // Daily Reports
  getDailyReports: () => request('/daily-reports'),
  createDailyReport: (data: any) => request('/daily-reports', { method: 'POST', body: JSON.stringify(data) }),
  updateDailyReport: (id: string, data: any) => request(`/daily-reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDailyReport: (id: string) => request(`/daily-reports/${id}`, { method: 'DELETE' }),
};
