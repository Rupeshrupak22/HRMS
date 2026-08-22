import { apiRequest } from './api';

const BASE = '/veena-portal';

function request(endpoint: string, options: RequestInit = {}) {
  return apiRequest(`${BASE}${endpoint}`, options);
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
