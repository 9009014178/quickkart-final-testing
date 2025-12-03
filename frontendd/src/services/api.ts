import axios from 'axios';

// <<< MODIFIED: Changed port from 5000 to 3000 (to match your server)
// AND removed /api from the end (to prevent double /api/api... routes)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Axios ka ek naya "instance" banate hain
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Interceptor (Sabse Zaroori)
 * Yeh code har API request ke saath automatically 'Authorization' header
 * me token ko attach kar dega, agar token localStorage me hai.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Header ko Bearer token format me set karo
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Request error hone par, use reject karo
    return Promise.reject(error);
  }
);

export default api;