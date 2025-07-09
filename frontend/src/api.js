import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
