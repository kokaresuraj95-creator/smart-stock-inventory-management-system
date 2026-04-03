import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params?: Record<string, string>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getStats: () => api.get('/products/stats'),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
  getAll: (params?: Record<string, string>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const supplierApi = {
  getAll: (params?: Record<string, string>) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertApi = {
  getAll: (params?: Record<string, string>) => api.get('/alerts', { params }),
  markRead: (id: string) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
  delete: (id: string) => api.delete(`/alerts/${id}`),
  create: (data: Record<string, unknown>) => api.post('/alerts', data),
};

// Attach token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Authentication ──────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role?: string) => 
    api.post('/auth/register', { name, email, password, role }),
  getMe: () => api.get('/auth/me')
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSales: (period?: string) => api.get('/analytics/sales', { params: { period } }),
  getCategories: () => api.get('/analytics/categories'),
  getInventory: () => api.get('/analytics/inventory'),
};

export default api;
