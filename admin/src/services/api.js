import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'https://established-vanny-digitz-b5fdc94b.koyeb.app') + '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = sessionStorage.getItem('adminRefreshToken');
        if (refreshToken) {
          const response = await axios.post((import.meta.env.VITE_API_URL || 'https://established-vanny-digitz-b5fdc94b.koyeb.app') + '/api/v1/auth/refresh-token', { refreshToken });
          const { token } = response.data.data;
          
          sessionStorage.setItem('adminToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminRefreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;