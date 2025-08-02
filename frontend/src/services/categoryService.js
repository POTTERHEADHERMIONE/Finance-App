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

const categoryService = {
  // Get all categories for the current user
  getCategories: async (type = null) => {
    const params = type ? { type } : {}; // optional query param
    const response = await API.get('/categories', {
      params, // will become ?type=expense for example
      headers: {
        user_id: localStorage.getItem('user_id') || 'demoUser123',
      },
    });
    return response.data;
  }
  ,

  // Get a single category by ID
  getCategory: async (id) => {
    const response = await API.get(`/categories/${id}`);
    return response.data;
  },

  // Create a new category
  createCategory: async (categoryData) => {
    const response = await API.post('/categories', categoryData);
    return response.data;
  },

  // Update a category
  updateCategory: async (id, categoryData) => {
    const response = await API.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete a category
  deleteCategory: async (id) => {
    const response = await API.delete(`/categories/${id}`);
    return response.data;
  },

  // Archive a category
  archiveCategory: async (id) => {
    const response = await API.put(`/categories/${id}/archive`);
    return response.data;
  },

  // Restore an archived category
  restoreCategory: async (id) => {
    const response = await API.put(`/categories/${id}/restore`);
    return response.data;
  },

  // Bulk delete categories
  bulkDeleteCategories: async (categoryIds) => {
    const response = await API.delete('/categories/bulk', {
      data: { categoryIds }
    });
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await API.get('/categories/stats', { params });
    return response.data;
  },

  // Get default categories
  getDefaultCategories: async () => {
    const response = await API.get('/categories/defaults');
    return response.data;
  },

  // Initialize default categories
  initializeDefaultCategories: async () => {
    const response = await API.post('/categories/init-defaults');
    return response.data;
  }
};

export default categoryService;