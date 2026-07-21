import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorShape } from '@/lib/types';

const ACCESS_TOKEN_KEY = 'teachalike_access_token';
const REFRESH_TOKEN_KEY = 'teachalike_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

interface TokenPair {
  access_token?: string;
  refresh_token?: string;
}

export function setTokens({ access_token, refresh_token }: TokenPair): void {
  if (typeof window === 'undefined') return;
  if (access_token) window.localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  if (refresh_token) window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token to every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface BackendErrorData {
  errors?: string[];
  error?: string;
}

// Normalize backend error shapes into a single { message, fields } error object.
export function normalizeError(error: AxiosError<BackendErrorData> | unknown): ApiErrorShape {
  const err = error as AxiosError<BackendErrorData>;
  const data = err?.response?.data;
  if (data?.errors && Array.isArray(data.errors)) {
    return { message: data.errors.join(' '), fields: data.errors, status: err.response?.status };
  }
  if (data?.error) {
    return { message: data.error, fields: [data.error], status: err.response?.status };
  }
  if (err?.code === 'ECONNABORTED') {
    return { message: 'The request took too long. Please check your connection and try again.', fields: [], status: err?.response?.status };
  }
  return { message: 'Something went wrong. Please try again.', fields: [], status: err?.response?.status };
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function flushQueue(err: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else if (token) resolve(token);
  });
  pendingQueue = [];
}

// On 401, try a single silent refresh, then retry the original request once.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<BackendErrorData>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute =
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/register') ||
      originalRequest?.url?.includes('/api/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );
        const newAccessToken = res.data.access_token;
        setTokens({ access_token: newAccessToken });
        flushQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        clearTokens();
        redirectToLogin();
        return Promise.reject(normalizeError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export default api;
