import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutos (RNF03)

api.interceptors.request.use((config) => {
  const { token, lastActivity, updateActivity, logout } = useAuthStore.getState();

  if (token) {
    if (Date.now() - lastActivity > INACTIVITY_LIMIT_MS) {
      logout();
      window.location.href = '/login?expired=true';
      return Promise.reject(new Error('Sessão encerrada por inatividade (10 min).'));
    }
    updateActivity();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      useAuthStore.getState().logout();
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);