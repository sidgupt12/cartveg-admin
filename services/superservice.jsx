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
      console.log('Request Params:', config.params || 'None');
      console.log('Request Body:', config.data || 'None');

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

  createUser: async ({ name, email, phone }) => {
    try {
      // Validate required fields
      if (!name || !email || !phone) {
        throw new Error('Name, email, and phone are required');
      }
  
      // Validate phone number (10 digits)
      if (!/^\d{10}$/.test(phone)) {
        throw new Error('Phone number must be 10 digits');
      }
  
      console.log('Creating user with data:', { name, email, phone, addresses: [] });
  
      const response = await superApi.post('/admin/user/create', {
        name,
        email,
        phone,
        addresses: [], // Send empty addresses array
      });
  
      console.log('Create user API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
  
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid user data provided');
      }
  
      throw error;
    }
  },
  
  updateUser: async ({ id, data }) => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }
  
      // Validate phone if provided
      if (data.phone && !/^\d{10}$/.test(data.phone)) {
        throw new Error('Phone number must be 10 digits');
      }
  
      // Prepare payload
      const payload = {
        id,
        data: {
          name: data.name,
          phone: data.phone,
        }
      };
  
      console.log('Updating user with data:', payload);
  
      const response = await superApi.put('/admin/user/update', payload);
  
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
};

export const storeService = {
  createAdmin: async ({ name, email, password, role, storeId }) => {
    try {
      // Validate required fields
      if (!name || !email || !password || !role) {
        throw new Error('Name, email, password, and role are required');
      }

      // Validate role
      if (!['superadmin', 'storemanager'].includes(role)) {
        throw new Error('Role must be either "superadmin" or "storemanager"');
      }

      // Validate storeId for storemanager
      if (role === 'storemanager' && !storeId) {
        throw new Error('storeId is required for storemanager role');
      }

      // Prepare payload
      const payload = {
        name,
        email,
        password,
        role,
      };

      // Include storeId only for storemanager
      if (role === 'storemanager') {
        payload.storeId = storeId;
      }

      console.log('Creating admin with data:', payload);

      const response = await superApi.post('/admin/create-admin', payload);

      console.log('Create admin API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating admin:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid admin data provided');
      }

      throw error;
    }
  },

  getStores: async ({ page = 1, limit = 10 }) => {
    try {
      console.log('Fetching stores with params:', { page, limit });
  
      const response = await superApi.get('/admin/stores', {
        params: { page, limit },
      });
  
      console.log('Get stores API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching stores:', {
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

  updateStore: async ({ storeId, data }) => {
    try {
      if (!storeId) {
        throw new Error('storeId is required');
      }
      if (!data || Object.keys(data).length === 0) {
        throw new Error('At least one field to update is required');
      }
  
      // Validate data fields
      const validFields = ['name', 'address', 'phone', 'email', 'longitude', 'latitude', 'radius', 'openingTime'];
      const providedFields = Object.keys(data);
      const invalidFields = providedFields.filter(field => !validFields.includes(field));
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields provided: ${invalidFields.join(', ')}`);
      }
  
      // Validate field types if provided
      if (data.name && typeof data.name !== 'string') {
        throw new Error('name must be a string');
      }
      if (data.address && typeof data.address !== 'object') {
        throw new Error('address must be an object');
      }
      if (data.phone && (typeof data.phone !== 'string' || !/^\d{10}$/.test(data.phone))) {
        throw new Error('phone must be a 10-digit string');
      }
      if (data.email && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
        throw new Error('email must be a valid email address');
      }
      if (data.longitude !== undefined && typeof data.longitude !== 'number') {
        throw new Error('longitude must be a number');
      }
      if (data.latitude !== undefined && typeof data.latitude !== 'number') {
        throw new Error('latitude must be a number');
      }
      if (data.radius !== undefined && (typeof data.radius !== 'number' || data.radius <= 0)) {
        throw new Error('radius must be a positive number');
      }
      if (data.openingTime && (typeof data.openingTime !== 'string' || !/^\d{2}-\d{2}$/.test(data.openingTime))) {
        throw new Error('openingTime must be a string in format "HH-MM"');
      }
  
      console.log('Updating store with data:', { storeId, data });
  
      const response = await superApi.put('/admin/update-store', { storeId, data });
  
      console.log('Update store API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating store:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
  
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid store data provided');
      } else if (error.response?.status === 404) {
        throw new Error('Store not found');
      }
  
      throw error;
    }
  },

  assignStoreManager: async ({ adminId, storeId }) => {
    try {
      // Validate required fields
      if (!adminId) {
        throw new Error('adminId is required');
      }
      if (!storeId) {
        throw new Error('storeId is required');
      }
  
      console.log('Assigning store manager with data:', { adminId, storeId });
  
      const response = await superApi.post('/admin/assign-store-manager', {
        adminId,
        storeId,
      });
  
      console.log('Assign store manager API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error assigning store manager:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
  
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid adminId or storeId provided');
      } else if (error.response?.status === 404) {
        throw new Error('Admin or store not found');
      }
  
      throw error;
    }
  },

  createStore: async ({ name, address, phone, email, latitude, longitude, radius }) => {
    try {
      // Validate required fields
      if (!name || typeof name !== 'string') {
        throw new Error('name is required and must be a string');
      }
      if (!address || typeof address !== 'object') {
        throw new Error('address is required and must be an object');
      }
      if (!address.flatno || typeof address.flatno !== 'string') {
        throw new Error('address.flatno is required and must be a string');
      }
      if (!address.street || typeof address.street !== 'string') {
        throw new Error('address.street is required and must be a string');
      }
      if (!address.city || typeof address.city !== 'string') {
        throw new Error('address.city is required and must be a string');
      }
      if (!address.state || typeof address.state !== 'string') {
        throw new Error('address.state is required and must be a string');
      }
      if (!address.pincode || typeof address.pincode !== 'string' || !/^\d{6}$/.test(address.pincode)) {
        throw new Error('address.pincode is required and must be a 6-digit string');
      }
      if (!phone || typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
        throw new Error('phone is required and must be a 10-digit string');
      }
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('email is required and must be a valid email address');
      }
      if (latitude === undefined || typeof latitude !== 'number') {
        throw new Error('latitude is required and must be a number');
      }
      if (longitude === undefined || typeof longitude !== 'number') {
        throw new Error('longitude is required and must be a number');
      }
      if (radius === undefined || typeof radius !== 'number' || radius <= 0) {
        throw new Error('radius is required and must be a positive number');
      }
  
      const payload = {
        name,
        address,
        phone,
        email,
        latitude,
        longitude,
        radius,
      };
  
      console.log('Creating store with data:', payload);
  
      const response = await superApi.post('/admin/create-store', payload);
  
      console.log('Create store API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating store:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
  
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid store data provided');
      } else if (error.response?.status === 409) {
        throw new Error('Store with this email or phone already exists');
      }
  
      throw error;
    }
  },

};

// Coupon Service
export const couponService = {
  createCoupon: async ({ code, expiry, minValue, maxUsage, offValue }) => {
    try {
      console.log('Creating coupon with body:', { code, expiry, minValue, maxUsage, offValue });
      
      // Build the request body
      const body = { code, expiry, minValue, maxUsage, offValue };
  
      const response = await superApi.post('/admin/coupon/create', body);
      console.log('Create coupon API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating coupon:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  getCoupons: async () => {
    try {
      console.log('Making API call to coupons');
      const response = await superApi.get('/admin/coupon');
      console.log('Coupons API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching coupons:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  changeCouponStatus: async ({ id, isActive }) => {
    try {
      console.log('Changing coupon status with params:', { id, isActive });
      
      // Build the request body
      const body = { isActive };
  
      const response = await superApi.put('/admin/coupon/status', body, {
        params: { id },
      });
      console.log('Change coupon status API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error changing coupon status:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  updateCoupon: async ({ id, code, expiry, minValue, maxUsage, offValue }) => {
    try {
      console.log('Updating coupon with params:', { id, code, expiry, minValue, maxUsage, offValue });
      
      // Build the request body with only provided fields
      const body = {};
      if (code !== undefined) body.code = code;
      if (expiry !== undefined) body.expiry = expiry;
      if (minValue !== undefined) body.minValue = minValue;
      if (maxUsage !== undefined) body.maxUsage = maxUsage;
      if (offValue !== undefined) body.offValue = offValue;
  
      const response = await superApi.put('/admin/coupon/update', body, {
        params: { id },
      });
      console.log('Update coupon API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating coupon:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },
};

// Cashback Service
export const cashbackService = {
  getCashbacks: async () => {
    try {
      console.log('Fetching cashbacks');
      const response = await superApi.get('/admin/cashback');
      console.log('Get cashbacks API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching cashbacks:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid request');
      }
      throw error;
    }
  },

  createCashback: async ({ min_purchase_amount, cashback_amount, isActive, description }) => {
    try {
      // Validate required fields
      if (!min_purchase_amount || typeof min_purchase_amount !== 'number' || min_purchase_amount <= 0) {
        throw new Error('min_purchase_amount is required and must be a positive number');
      }
      if (!cashback_amount || typeof cashback_amount !== 'number' || cashback_amount <= 0) {
        throw new Error('cashback_amount is required and must be a positive number');
      }
      if (isActive === undefined || typeof isActive !== 'boolean') {
        throw new Error('isActive is required and must be a boolean');
      }
      if (!description || typeof description !== 'string') {
        throw new Error('description is required and must be a string');
      }

      const payload = {
        min_purchase_amount,
        cashback_amount,
        isActive,
        description,
      };

      console.log('Creating cashback with data:', payload);

      const response = await superApi.post('/admin/cashback/create', payload);

      console.log('Create cashback API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating cashback:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid cashback data provided');
      }
      throw error;
    }
  },

  updateCashbackStatus: async ({ id, isActive }) => {
    try {
      // Validate required fields
      if (!id || typeof id !== 'string') {
        throw new Error('id is required and must be a string');
      }
      if (isActive === undefined || typeof isActive !== 'boolean') {
        throw new Error('isActive is required and must be a boolean');
      }
  
      const payload = {
        id,
        isActive,
      };
  
      console.log('Updating cashback status with data:', payload);
  
      const response = await superApi.put('/admin/cashback/status', payload);
  
      console.log('Update cashback status API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating cashback status:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid cashback data provided');
      } else if (error.response?.status === 404) {
        throw new Error('Cashback not found');
      }
      throw error;
    }
  },

};

export const productService = {
  getProducts: async ({ page = 1, limit = 10 } = {}) => {
    try {
      console.log('Fetching products with params:', { page, limit });

      const response = await superApi.get('/admin/products', {
        params: { page, limit },
      });

      console.log('Get products API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', {
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

  createProduct: async ({
    unit,
    name,
    description,
    price,
    category,
    origin,
    shelfLife,
    isAvailable,
    image,
    actualPrice,
  }) => {
    try {
      // Basic validation
      if (!name || typeof name !== 'string') {
        throw new Error('Name is required and must be a string');
      }
      if (!price || isNaN(price) || price <= 0) {
        throw new Error('Price is required and must be a positive number');
      }
      if (!category || typeof category !== 'string') {
        throw new Error('Category is required and must be a string');
      }

      const payload = [{
        unit,
        name,
        description,
        price,
        category,
        origin,
        shelfLife,
        isAvailable,
        image,
        actualPrice,
      }];

      console.log('Creating product with data:', payload);

      const response = await superApi.post('/admin/createProducts', payload);
      
      // Check if response has the expected structure
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }

      console.log('Create product API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid product data provided');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred while creating product');
      }

      // If it's our own error (from validation), throw it directly
      if (error.message && !error.response) {
        throw error;
      }

      // For any other error, throw a generic error
      throw new Error('Failed to create product: ' + (error.message || 'Unknown error'));
    }
  },

  deleteProduct: async ({ id }) => {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      console.log('Deleting product with ID:', id);

      const response = await superApi.delete('/admin/deleteProducts', {
        data: [id], // Send as array to match backend expectation
      });

      console.log('Delete product API response:', response.data);

      // Check if deletion was successful
      if (response.data.data.deletedCount === 0) {
        throw new Error('No products were deleted, possibly invalid or non-existent ID');
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting product:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid product ID provided');
      } else if (error.response?.status === 404) {
        throw new Error('Product not found');
      } else if (error.response?.status === 500) {
        throw new Error(error.response.data.message || 'Internal server error');
      }

      throw error;
    }
  },
};

// Notification Service
export const notificationService = {
  sendNotification: async ({ title, body }) => {
    try {
      // Validate required fields
      if (!title || typeof title !== 'string') {
        throw new Error('Title is required and must be a string');
      }
      if (!body || typeof body !== 'string') {
        throw new Error('Body is required and must be a string');
      }

      console.log('Sending notification with data:', { title, body });

      const response = await superApi.post('/admin/send-notification', {
        title,
        body,
      });

      console.log('Send notification API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid notification data provided');
      }

      throw error;
    }
  },
};

export const analysisService = {
  getAnalysis: async ({ startDate, endDate }) => {
    try {
      // Validate required fields
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }


      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        throw new Error('Start date must be before end date');
      }

      console.log('Fetching analysis with params:', { startDate, endDate });

      const response = await superApi.get('/admin/analysis', {
        params: { startDate, endDate },
      });

      console.log('Get analysis API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid date range provided');
      }

      throw error;
    }
  },
};

export const orderService = {
  getOrders: async ({ page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc', userId = '' } = {}) => {
    try {
      // Validate parameters
      if (page < 1) {
        throw new Error('Page number must be greater than 0');
      }
      if (limit < 1) {
        throw new Error('Limit must be greater than 0');
      }
      if (!['date', 'totalAmount', 'status'].includes(sortBy)) {
        throw new Error('Invalid sortBy parameter. Must be one of: date, totalAmount, status');
      }
      if (!['asc', 'desc'].includes(sortOrder)) {
        throw new Error('Invalid sortOrder parameter. Must be either asc or desc');
      }

      console.log('Fetching orders with params:', { page, limit, sortBy, sortOrder, userId });

      const response = await superApi.get('/admin/orders', {
        params: {
          page,
          limit,
          sortBy,
          sortOrder,
          userId: userId || undefined, // Only include userId if it's not empty
        },
      });

      console.log('Get orders API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', {
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

  updateOrder: async ({ orderId, status }) => {
    try {
      // Validate required fields
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      if (!status) {
        throw new Error('Status is required');
      }

      // Validate status
      const validStatuses = ['placed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Get current order to validate status transition
      const currentOrder = await superApi.get(`/admin/orders/${orderId}`);
      const currentStatus = currentOrder.data.orders[0].status;
      
      // Validate status transition
      const statusIndex = validStatuses.indexOf(status);
      const currentStatusIndex = validStatuses.indexOf(currentStatus);
      
      if (statusIndex < currentStatusIndex) {
        throw new Error(`Cannot change status from ${currentStatus} to ${status}. Status can only be updated forward.`);
      }

      console.log('Updating order status:', { orderId, status });

      const response = await superApi.put('/admin/update/order', {
        orderId,
        status,
      });

      console.log('Update order API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating order:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid order data provided');
      } else if (error.response?.status === 404) {
        throw new Error('Order not found');
      }

      throw error;
    }
  },
};

export default superApi;