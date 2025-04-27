// app/services/GlobalService.jsx
'use client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { authService } from './authService'; // Ensure authService is imported

// Create the API instance
const globalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication
globalApi.interceptors.request.use(
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
globalApi.interceptors.response.use(
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



export default globalApi;