import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import authService from '../services/authService';

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  TOKEN_REFRESH: 'TOKEN_REFRESH'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        token: action.payload.token
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (token) {
          // Set token in axios defaults
          authService.setAuthToken(token);
          
          // Verify token by getting user profile
          const response = await authService.getProfile();
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token,
              refreshToken
            }
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        // Remove invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        authService.removeAuthToken();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authService.login(email, password);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in axios defaults
      authService.setAuthToken(token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token, refreshToken }
      });
      
      enqueueSnackbar('Login successful!', { variant: 'success' });
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await authService.register(userData);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in axios defaults
      authService.setAuthToken(token);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token, refreshToken }
      });
      
      enqueueSnackbar('Registration successful!', { variant: 'success' });
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    authService.removeAuthToken();
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    enqueueSnackbar('Logged out successfully', { variant: 'info' });
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: response.data.user
      });
      
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      enqueueSnackbar('Password changed successfully!', { variant: 'success' });
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return { success: false, error: errorMessage };
    }
  };

  // Refresh token function
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authService.refreshToken(refreshToken);
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
      
      dispatch({
        type: AUTH_ACTIONS.TOKEN_REFRESH,
        payload: { token }
      });
      
      return token;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshAuthToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};