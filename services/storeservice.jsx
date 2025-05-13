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
      // Ensure page and limit are numbers and within valid ranges
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, parseInt(limit));
      
      console.log('Making API call to inventory with params:', { 
        page: pageNum, 
        limit: limitNum, 
        storeId,
        skip: (pageNum - 1) * limitNum // Add skip parameter for proper pagination
      });

      const response = await api.get('/inventory/', {
        params: {
          page: pageNum,
          limit: limitNum,
          skip: (pageNum - 1) * limitNum,
          storeId,
        },
      });

      console.log('Inventory API response:', {
        totalProducts: response.data?.data?.pagination?.totalProducts,
        currentPage: response.data?.data?.pagination?.currentPage,
        totalPages: response.data?.data?.pagination?.totalPages,
        productsCount: response.data?.data?.products?.length
      });
      
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

  getAllProducts: async ({ page = 1, limit = 10 } = {}) => {
    const storeId = authService.getStoreId();
    console.log('Store ID from getProducts is this :', storeId);

    if (!storeId) {
      console.warn('Store ID is missing or not set in Cookies');
      return;
    }

    try {
      console.log('Making API call to inventory with params:', { page, limit, storeId });
      const response = await api.get('/inventory/product/', {
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

  addProduct: async ({ storeId, products }) => {
    try {
      console.log('Adding product(s) with params:', { storeId, products });
      
      const body = { storeId, products };
      
      const response = await api.post('/inventory/add', body);
      console.log('Add product API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding product(s):', {
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
        throw new Error('An Error occured try again later, or contact administrator');
      }
      throw error;
    }
  },

};

// Report Service
export const reportService = {
  uploadPurchaseReport: async (formData, storeId, date) => {
    try {
      console.log('Uploading purchase report with params:', { storeId, date });
      
      if (!storeId) {
        console.warn('Store ID is missing or not set');
        throw new Error('Store ID is required for purchase report upload');
      }

      if (!date) {
        console.warn('Date is missing or not set');
        throw new Error('Date is required for purchase report upload');
      }

      const response = await api.post('/report/upload-purchase-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { storeId, date },
      });

      console.log('Purchase report upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading purchase report:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      if (error.message.includes('Network Error')) {
        throw new Error('An error occurred. Please try again later or contact administrator');
      }
      throw error;
    }
  },

  getDailyReport: 
  async (storeId, date) => {
    try {
      console.log('Fetching daily report with params:', { storeId, date });
      
      if (!storeId) {
        console.warn('Store ID is missing or not set');
        throw new Error('Store ID is required for fetching daily report');
      }

      if (!date) {
        console.warn('Date is missing or not set');
        throw new Error('Date is required for fetching daily report');
      }

      const response = await api.get('/report/store-report', {
        params: { storeId, date },
      });

      console.log('Daily report response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily report:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.message.includes('Network Error')) {
        throw new Error('An error occurred. Please try again later or contact administrator');
      }
      throw error;
    }
  },
};

// Order Service
export const orderService = {
  getOrders: async (storeId) => {
    try {
      console.log('Fetching orders for store:', storeId);
      
      if (!storeId) {
        console.warn('Store ID is missing or not set');
        throw new Error('Store ID is required for fetching orders');
      }

      const response = await api.get('/inventory/order/', {
        params: { 
          storeId,
          limit: 100, // Increased limit to get all orders
          page: 1,
          sortBy: 'date',
          sortOrder: 'desc'
        },
      });

      console.log('Orders API response:', {
        totalOrders: response.data?.data?.totalOrders,
        currentPage: response.data?.data?.currentPage,
        totalPages: response.data?.data?.totalPages,
        ordersCount: response.data?.data?.orders?.length
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.message.includes('Network Error')) {
        throw new Error('An error occurred. Please try again later or contact administrator');
      }
      throw error;
    }
  },

  updateOrder: async ({ orderId, storeId, newStatus }) => {
    try {
      console.log('Updating order status:', { orderId, storeId, newStatus });

      if (!orderId || !storeId || !newStatus) {
        throw new Error('Order ID, Store ID, and new status are required');
      }

      // Validate status
      const validStatuses = ['placed', 'confirmed', 'shipped', 'cancelled'];
      if (!validStatuses.includes(newStatus.toLowerCase())) {
        throw new Error('Invalid status. Must be one of: placed, confirmed, shipped, cancelled');
      }

      const response = await api.put('/inventory/order/update', {
        orderId,
        storeId,
        newStatus: newStatus.toLowerCase()
      });

      console.log('Update order response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating order:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.message.includes('Network Error')) {
        throw new Error('An error occurred. Please try again later or contact administrator');
      }
      throw error;
    }
  },
};

export default api;