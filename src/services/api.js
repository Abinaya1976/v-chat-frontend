import axios from 'axios';

// Create a configured Axios instance
// Uses live Railway API by default or overridden via VITE_API_URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Bearer token and current organization to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('chatapp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userStr = sessionStorage.getItem('chatapp_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const orgId = user.currentOrganizationId || user.currentOrganization?._id || user.currentOrganization;
        if (orgId && typeof orgId === 'string') {
          config.headers['x-organization-id'] = orgId;
        }
      } catch (e) {
        // ignore parse error
      }
    }
    // For FormData payloads, remove Content-Type so the browser/axios attaches multipart boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: handle connection refused / 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('chatapp_token');
      sessionStorage.removeItem('chatapp_user');
    }
    if (!error.response) {
      console.warn('API Connection issue:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
