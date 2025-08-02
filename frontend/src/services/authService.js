import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
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

// Response interceptor to handle token expiry
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken }
          );

          const { token } = response.data.data;
          localStorage.setItem('token', token);
          API.defaults.headers.Authorization = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return API(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  // Set authentication token
  setAuthToken: (token) => {
    if (token) {
      API.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.Authorization;
    }
  },

  // Remove authentication token
  removeAuthToken: () => {
    delete API.defaults.headers.Authorization;
  },

  // User registration
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },

  // User login
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await API.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await API.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await API.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await API.post('/auth/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await API.delete('/auth/account', {
      data: { password }
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await API.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await API.get('/auth/stats');
    return response.data;
  }
};

export default authService;