import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

import { mockIncidents, mockVehicles, mockQueueData } from './mockData';

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // --- MOCK FALLBACK (for offline backend UI testing) ---
    const url = err.config?.url;
    if (err.message === 'Network Error' || err.code === 'ERR_CONNECTION_REFUSED' || err.response === undefined) {
      if (url?.includes('/incidents')) {
        return Promise.resolve({ data: { data: mockIncidents } });
      }
      if (url?.includes('/vehicles')) {
        return Promise.resolve({ data: { data: mockVehicles } });
      }
      if (url?.includes('/dispatch/queue')) {
        return Promise.resolve({ data: { data: mockQueueData } });
      }
    }
    // --- END MOCK FALLBACK ---

    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
