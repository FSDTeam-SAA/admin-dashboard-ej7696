import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { getOrCreateInstallationId, INSTALLATION_ID_HEADER } from './installation-id';

const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const trimmedBaseUrl = rawBaseUrl;
const baseURL = trimmedBaseUrl

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshSessionPromise: Promise<Awaited<ReturnType<typeof getSession>>> | null = null;
let sharedSessionPromise: Promise<Awaited<ReturnType<typeof getSession>>> | null = null;
let cachedSession: Awaited<ReturnType<typeof getSession>> | null = null;
let cachedSessionAt = 0;
let isSigningOut = false;
const SESSION_CACHE_TTL_MS = 5000;

const setHeader = (
  headers: AxiosRequestConfig['headers'] | undefined,
  headerName: string,
  headerValue: string
) => {
  if (!headerValue) {
    return headers;
  }

  if (headers && typeof (headers as { set?: (name: string, value: string) => void }).set === 'function') {
    (headers as { set: (name: string, value: string) => void }).set(headerName, headerValue);
    return headers;
  }

  return {
    ...(headers ?? {}),
    [headerName]: headerValue,
  };
};

const getRefreshedSession = async () => {
  if (!refreshSessionPromise) {
    refreshSessionPromise = getSession({ broadcast: false })
      .then((session) => {
        cachedSession = session;
        cachedSessionAt = Date.now();
        return session;
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }
  return refreshSessionPromise;
};

const getSharedSession = async () => {
  const now = Date.now();
  if (cachedSession && now - cachedSessionAt < SESSION_CACHE_TTL_MS) {
    return cachedSession;
  }

  if (!sharedSessionPromise) {
    sharedSessionPromise = getSession({ broadcast: false })
      .then((session) => {
        cachedSession = session;
        cachedSessionAt = Date.now();
        return session;
      })
      .finally(() => {
        sharedSessionPromise = null;
      });
  }

  return sharedSessionPromise;
};

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const installationId = getOrCreateInstallationId();
      if (installationId) {
        config.headers = setHeader(config.headers, INSTALLATION_ID_HEADER, installationId);
      }

      const session = await getSharedSession();
      if (session?.accessToken) {
        config.headers = setHeader(config.headers, 'Authorization', `Bearer ${session.accessToken}`);
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
      if (session?.accessToken) {
        originalRequest.headers = setHeader(
          originalRequest.headers,
          'Authorization',
          `Bearer ${session.accessToken}`
        );
        return axiosInstance(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        if (!isSigningOut) {
          isSigningOut = true;
          cachedSession = null;
          cachedSessionAt = 0;
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
