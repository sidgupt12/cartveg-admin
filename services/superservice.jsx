'use client';
import axios from 'axios';
import Cookies from 'js-cookie';

// Create a superadmin-specific axios instance
const superApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication
superApi.interceptors.request.use(
  (config) => {
    try {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to headers:', token.substring(0, 10) + '...');
      } else {
        console.warn('No token found in Cookies');
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
superApi.interceptors.response.use(
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

export const userService = {
    createUser: async ({ name, email, phone, addresses }) => {
        try {
          // Validate required fields
          if (!name || !email || !phone || !addresses || addresses.length < 1) {
            throw new Error('Name, email, phone, and at least one address are required');
          }
    
          // Validate phone number (10 digits)
          if (!/^\d{10}$/.test(phone)) {
            throw new Error('Phone number must be 10 digits');
          }
    
          // Validate addresses
          addresses.forEach((address, index) => {
            if (!address.flatno || !address.street || !address.city || !address.state || !address.pincode) {
              throw new Error(`All address fields are required for address ${index + 1}`);
            }
          });
    
          console.log('Creating user with data:', { name, email, phone, addresses });
    
          const response = await superApi.post('/admin/user/create', {
            name,
            email,
            phone,
            addresses,
          });
    
          console.log('Create user API response:', response.data);
          return response.data;
        } catch (error) {
          console.error('Error creating user:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
    
          // Handle specific error cases
          if (error.response?.status === 401) {
            throw new Error('Unauthorized: Invalid or expired token');
          } else if (error.response?.status === 400) {
            throw new Error(error.response.data.message || 'Invalid user data provided');
          }
    
          throw error;
        }
      },

      getUsers: async ({ role = '', page = 1, limit = 10 } = {}) => {
        try {
          console.log('Fetching users with params:', { role, page, limit });
      
          const response = await superApi.get('/admin/users', {
            params: { role, page, limit },
          });
      
          console.log('Get users API response:', response.data);
          return response.data;
        } catch (error) {
          console.error('Error fetching users:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
      
          if (error.response?.status === 401) {
            throw new Error('Unauthorized: Invalid or expired token');
          } else if (error.response?.status === 400) {
            throw new Error(error.response.data.message || 'Invalid request parameters');
          }
      
          throw error;
        }
      },

      updateUser: async ({ id, data }) => {
        try {
          // Validate required field
          if (!id) {
            throw new Error('User ID is required');
          }
      
          console.log('Updating user with data:', { id, data });
      
          const response = await superApi.put('/admin/user/update', {
            id,
            data,
          });
      
          console.log('Update user API response:', response.data);
          return response.data;
        } catch (error) {
          console.error('Error updating user:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
      
          if (error.response?.status === 401) {
            throw new Error('Unauthorized: Invalid or expired token');
          } else if (error.response?.status === 400) {
            throw new Error(error.response.data.message || 'Invalid update data provided');
          }
      
          throw error;
        }
      },

      deleteUser: async ({ id }) => {
        try {
          // Validate required field
          if (!id) {
            throw new Error('User ID is required');
          }
      
          console.log('Deleting user with ID:', id);
      
          const response = await superApi.delete('/admin/user/delete', {
            data: { id },
          });
      
          console.log('Delete user API response:', response.data);
          return response.data;
        } catch (error) {
          console.error('Error deleting user:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
      
          if (error.response?.status === 401) {
            throw new Error('Unauthorized: Invalid or expired token');
          } else if (error.response?.status === 400) {
            throw new Error(error.response.data.message || 'Invalid user ID provided');
          }
      
          throw error;
        }
      },
}


export default superApi;