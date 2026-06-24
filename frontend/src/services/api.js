import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getDashboardStats: () => api.get('/invoices/dashboard/stats'),
  getNextNumber: () => api.get('/invoices/next-number'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (formData) =>
    api.put('/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const publicAPI = {
  getInvoice: (invoiceNumber) => api.get(`/public/invoice/${invoiceNumber}`),
};

export const formatAPI = {
  getAll: () => api.get('/formats'),
  getById: (id) => api.get(`/formats/${id}`),
  create: (data) => api.post('/formats', data),
  update: (id, data) => api.put(`/formats/${id}`, data),
  delete: (id) => api.delete(`/formats/${id}`),
};

export default api;
