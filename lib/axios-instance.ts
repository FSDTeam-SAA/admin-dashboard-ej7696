import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const baseURL = trimmedBaseUrl.endsWith('/api/v1')
  ? trimmedBaseUrl.slice(0, -'/api/v1'.length)
  : trimmedBaseUrl;

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshSessionPromise: Promise<Awaited<ReturnType<typeof getSession>>> | null = null;
let isSigningOut = false;

const getRefreshedSession = async () => {
  if (!refreshSessionPromise) {
    refreshSessionPromise = getSession({ broadcast: false }).finally(() => {
      refreshSessionPromise = null;
    });
  }
  return refreshSessionPromise;
};

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession({ broadcast: false });
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      console.error('[v0] Error getting session:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (typeof window !== 'undefined' && error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const session = await getRefreshedSession();
      if (session?.accessToken && !session?.error) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${session.accessToken}`,
        };
        return axiosInstance(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        if (!isSigningOut) {
          isSigningOut = true;
          await signOut({ redirect: true, callbackUrl: '/auth/login' });
        } else {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
