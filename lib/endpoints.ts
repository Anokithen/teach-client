import api from '@/lib/api';
import { Role } from '@/lib/types';

// ---- Auth ----
export const authApi = {
  register: (payload: { name: string; email: string; password: string; role: Role }) =>
    api.post('/api/auth/register', payload),
  login: (payload: { email: string; password: string }) => api.post('/api/auth/login', payload),
  logout: () => api.post('/api/auth/logout'),
};

// ---- Account ("parent" object holds parent/teacher/admin) ----
export const accountApi = {
  me: () => api.get('/api/parents/me'),
  update: (payload: { name?: string; email?: string; password?: string }) =>
    api.patch('/api/parents/me', payload),
  remove: () => api.delete('/api/parents/me'),
};

// ---- Children ----
export const childrenApi = {
  list: () => api.get('/api/children'),
  get: (id: number | string) => api.get(`/api/children/${id}`),
  create: (payload: { name: string; age: number; reading_level: string; parent_id?: number }) =>
    api.post('/api/children', payload),
  update: (id: number | string, payload: Partial<{ name: string; age: number; reading_level: string }>) =>
    api.patch(`/api/children/${id}`, payload),
  remove: (id: number | string) => api.delete(`/api/children/${id}`),
  sessions: (id: number | string) => api.get(`/api/children/${id}/reading-sessions`),
  gameResults: (id: number | string) => api.get(`/api/children/${id}/game-results`),
  leaderboardEntry: (id: number | string, week: string = 'current') =>
    api.get(`/api/children/${id}/leaderboard-entry`, { params: { week } }),
};

// ---- Books ----
export const booksApi = {
  list: (params: Record<string, string> = {}) => api.get('/api/books', { params }),
  get: (id: number | string) => api.get(`/api/books/${id}`),
  download: (id: number | string) => api.get(`/api/books/${id}/download`),
  miniGames: (id: number | string) => api.get(`/api/books/${id}/mini-games`),
};

// ---- Mini-games ----
export const miniGamesApi = {
  get: (id: number | string) => api.get(`/api/mini-games/${id}`),
  submitResult: (id: number | string, payload: { child_id: number; score: number }) =>
    api.post(`/api/mini-games/${id}/results`, payload),
};

// ---- Reading sessions ----
export const sessionsApi = {
  create: (payload: { child_id: number; book_id: number; voice_profile_id?: number }) =>
    api.post('/api/reading-sessions', payload),
  get: (id: number | string) => api.get(`/api/reading-sessions/${id}`),
  update: (id: number | string, payload: Record<string, unknown>) =>
    api.patch(`/api/reading-sessions/${id}`, payload),
  generateFeedback: (id: number | string, payload: Record<string, unknown> = {}) =>
    api.post(`/api/reading-sessions/${id}/feedback`, payload),
  listFeedback: (id: number | string) => api.get(`/api/reading-sessions/${id}/feedback`),
};

// ---- Voice profiles ----
export const voiceProfilesApi = {
  list: () => api.get('/api/voice-profiles'),
  create: (payload: FormData) =>
    api.post('/api/voice-profiles', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  status: (id: number | string) => api.get(`/api/voice-profiles/${id}/status`),
  audio: (id: number | string) => api.get(`/api/voice-profiles/${id}/audio`, { responseType: 'blob' }),
  update: (id: number | string, payload: { label: string }) => api.patch(`/api/voice-profiles/${id}`, payload),
  remove: (id: number | string) => api.delete(`/api/voice-profiles/${id}`),
};

// ---- Leaderboard ----
export const leaderboardApi = {
  list: (week: string = 'current') => api.get('/api/leaderboard', { params: { week } }),
};

// ---- Sync ----
export const syncApi = {
  push: (payload: Record<string, unknown>) => api.post('/api/sync', payload),
};

// ---- Admin ----
export const adminApi = {
  listParents: () => api.get('/api/admin/parents'),
  createParent: (payload: { name: string; email: string; password: string }) =>
    api.post('/api/admin/parents', payload),
  getParent: (id: number | string) => api.get(`/api/admin/parents/${id}`),
  banParent: (id: number | string) => api.patch(`/api/admin/parents/${id}/ban`),
  unbanParent: (id: number | string) => api.patch(`/api/admin/parents/${id}/unban`),
  deleteParent: (id: number | string) => api.delete(`/api/admin/parents/${id}`),

  listTeachers: () => api.get('/api/admin/teachers'),
  createTeacher: (payload: { name: string; email: string; password: string }) =>
    api.post('/api/admin/teachers', payload),
  banTeacher: (id: number | string) => api.patch(`/api/admin/teachers/${id}/ban`),
  unbanTeacher: (id: number | string) => api.patch(`/api/admin/teachers/${id}/unban`),
  deleteTeacher: (id: number | string) => api.delete(`/api/admin/teachers/${id}`),

  createAdmin: (payload: { name: string; email: string; password: string }) =>
    api.post('/api/admin/admins', payload),
  createBook: (payload: {
    title: string;
    age_group: string;
    reading_level: 'beginner' | 'intermediate' | 'advanced';
    text_content?: string;
    content_url?: string;
  }) => api.post('/api/admin/books', payload),
};
