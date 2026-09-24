import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Axios instance pre-configured for FocusLearn API.
 * Automatically includes JWT token from localStorage.
 */
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('focuslearn_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('focuslearn_token');
      localStorage.removeItem('focuslearn_user');
      // Redirect to login only if not already on public auth pages
      const publicPaths = ['/login', '/register', '/forgot-password'];
      const isPublicPath =
        publicPaths.includes(window.location.pathname) ||
        window.location.pathname.startsWith('/reset-password');

      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── API Helper Functions ──

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const courseAPI = {
  create: (data) => api.post('/courses', data),
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const quizAPI = {
  generate: (videoId, regenerate = false) =>
    api.post(`/quizzes/generate/${videoId}${regenerate ? '?regenerate=true' : ''}`),
  getByVideo: (videoId) => api.get(`/quizzes/${videoId}`),
  submit: (quizId, answers) => api.post(`/quizzes/${quizId}/submit`, { answers }),
};

export const noteAPI = {
  create: (data) => api.post('/notes', data),
  getByVideo: (videoId) => api.get(`/notes/${videoId}`),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const progressAPI = {
  getByCourse: (courseId) => api.get(`/progress/${courseId}`),
  update: (courseId, data) => api.put(`/progress/${courseId}`, data),
  getDashboard: () => api.get('/progress/dashboard'),
};

export const takedownAPI = {
  submit: (data) => api.post('/takedown', data),
  getAll: (params) => api.get('/takedown', { params }),
  updateStatus: (id, data) => api.put(`/takedown/${id}`, data),
};

export default api;
