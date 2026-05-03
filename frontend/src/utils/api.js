import axios from 'axios';
import storage from './storage';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.24:4000',
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItemAsync('token');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
