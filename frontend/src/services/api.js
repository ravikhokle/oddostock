import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Product APIs
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock')
};

// Receipt APIs
export const receiptAPI = {
  getAll: (params) => api.get('/receipts', { params }),
  getById: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
  update: (id, data) => api.put(`/receipts/${id}`, data),
  validate: (id) => api.post(`/receipts/${id}/validate`),
  cancel: (id) => api.post(`/receipts/${id}/cancel`)
};

// Delivery APIs
export const deliveryAPI = {
  getAll: (params) => api.get('/deliveries', { params }),
  getById: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  pick: (id, items) => api.post(`/deliveries/${id}/pick`, { items }),
  pack: (id, items) => api.post(`/deliveries/${id}/pack`, { items }),
  validate: (id) => api.post(`/deliveries/${id}/validate`),
  cancel: (id) => api.post(`/deliveries/${id}/cancel`)
};

// Transfer APIs
export const transferAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  update: (id, data) => api.put(`/transfers/${id}`, data),
  validate: (id) => api.post(`/transfers/${id}/validate`),
  cancel: (id) => api.post(`/transfers/${id}/cancel`)
};

// Adjustment APIs
export const adjustmentAPI = {
  getAll: (params) => api.get('/adjustments', { params }),
  getById: (id) => api.get(`/adjustments/${id}`),
  create: (data) => api.post('/adjustments', data),
  update: (id, data) => api.put(`/adjustments/${id}`, data),
  validate: (id) => api.post(`/adjustments/${id}/validate`),
  cancel: (id) => api.post(`/adjustments/${id}/cancel`)
};

// Dashboard APIs
export const dashboardAPI = {
  getKPIs: (params) => api.get('/dashboard/kpis', { params }),
  getInventorySummary: () => api.get('/dashboard/inventory-summary'),
  getSalesAndPurchaseChart: (params) => api.get('/dashboard/sales-purchase-chart', { params })
};

// Warehouse APIs
export const warehouseAPI = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
  createLocation: (data) => api.post('/warehouses/locations', data),
  getLocations: (warehouseId) => api.get(`/warehouses/${warehouseId}/locations`)
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Move History APIs
export const moveHistoryAPI = {
  getAll: (params = {}) => api.get('/move-history', { params }),
  getByProduct: (productId) => api.get(`/move-history/product/${productId}`)
};

export default api;
