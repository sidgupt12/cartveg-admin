'use client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { authService } from './authService'; // Ensure authService is imported

// Create the API instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    try {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to headers:', token.substring(0, 10) + '...');
      } else {
        console.warn('No token found in Cookies');
      }

      const storeId = Cookies.get('storeId');
      if (storeId) {
        config.headers['X-Store-Id'] = storeId;
        console.log('Store ID added to headers:', storeId);
      } else {
        console.warn('No storeId found in Cookies');
      }

      console.log('Request URL:', config.baseURL + config.url);
      console.log('Request Params:', config.params);

      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Product Service
export const productService = {
  getProducts: async ({ page = 1, limit = 10 } = {}) => {
    const storeId = authService.getStoreId();
    console.log('Store ID from getProducts is this :', storeId);

    if (!storeId) {
      console.warn('Store ID is missing or not set in Cookies');
      return;
    }

    try {
      console.log('Making API call to inventory with params:', { page, limit, storeId });
      const response = await api.get('/inventory/', {
        params: {
          page,
          limit,
          storeId,
        },
      });

      console.log('Inventory API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  updateProduct: async ({ storeId, productId, quantity, availability, threshold }) => {
    try {
      console.log('Updating product with params:', { storeId, productId, quantity, availability, threshold });
      
      // Build the request body with only provided fields
      const body = { storeId, productId };
      if (quantity !== undefined) body.quantity = quantity;
      if (availability !== undefined) body.availability = availability;
      if (threshold !== undefined) body.threshold = threshold;
  
      const response = await api.put('/inventory/update', body);
      console.log('Update product API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  uploadCSV: async (formData, storeId) => {
    try {
      console.log('Uploading CSV with storeId:', storeId);
      
      if (!storeId) {
        console.warn('Store ID is missing or not set');
        throw new Error('Store ID is required for CSV upload');
      }

      const response = await api.post('/inventory/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { storeId },
      });

      console.log('CSV upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading CSV:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      if (error.message.includes('Network Error')) {
        throw new Error('CORS error: Server does not allow POST requests for CSV upload from this origin. Please contact the server administrator.');
      }
      throw error;
    }
  },

};

export default api;