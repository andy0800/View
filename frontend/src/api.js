import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4001',
  withCredentials: true // ✅ rely on httpOnly cookie
});

// ✅ Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/api/comments')) {
        // Clear any client-side hints; cookies are authoritative
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;