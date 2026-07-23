import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://established-vanny-digitz-b5fdc94b.koyeb.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData requests - browser will set it with boundary
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('https://established-vanny-digitz-b5fdc94b.koyeb.app/api/v1/auth/refresh-token', { refreshToken });
          const { token } = response.data.data;
          
          localStorage.setItem('token', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionExpiry');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // Dispatch frozen account event
    if (error.response?.data?.code === 'ACCOUNT_FROZEN') {
      window.dispatchEvent(new CustomEvent('frozen-account'));
    }
    
    return Promise.reject(error);
  }
);

export default api;