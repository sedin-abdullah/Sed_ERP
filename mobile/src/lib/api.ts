import axios from 'axios';
import { API_URL } from '@/config';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({ baseURL: API_URL, timeout: 65000 });

// Attach the JWT to every request when logged in.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}
