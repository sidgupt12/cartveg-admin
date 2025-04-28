'use client';
import axios from 'axios';
import Cookies from 'js-cookie';

// Create an auth-specific axios instance without interceptors
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add debugging interceptors
authApi.interceptors.request.use(
  config => {
    console.log('Auth Request URL:', `${config.baseURL}/${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

authApi.interceptors.response.use(
  response => response,
  error => {
    console.error('Auth API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    }
    return Promise.reject(error);
  }
);

export const authService = {
    login: async (email, password) => {
        try {
          console.log('Login attempt for:', email);
          
          // Try both approaches for maximum compatibility
          let response;
          let responseData;
          
          try {
            // Attempt with Axios first
            response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`,
              { email, password },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
              }
            );
            responseData = response.data;
          } catch (axiosError) {
            console.warn('Axios login failed, trying fetch API:', axiosError.message);
            
            // Fall back to fetch API
            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            
            responseData = await fetchResponse.json();
            
            if (!fetchResponse.ok) {
              throw new Error(responseData.message || `Server returned ${fetchResponse.status}`);
            }
          }
          
          const { success, data, message } = responseData;
          
          if (success && data?.token) {
            // Store token in cookies
            Cookies.set('token', data.token, {
              expires: new Date(data.tokenValidTill),
              secure: true,
              sameSite: 'Strict',
            });
            
            // Store expiry date
            Cookies.set('token_expiry', data.tokenValidTill, {
              expires: new Date(data.tokenValidTill),
              secure: true,
              sameSite: 'Strict',
            });
            
            // Store user role
            Cookies.set('userRole', data.user.role, {
              expires: new Date(data.tokenValidTill),
              secure: true,
              sameSite: 'Strict',
            });
            
            // Store user data
            Cookies.set('userData', JSON.stringify(data.user), {
              expires: new Date(data.tokenValidTill),
              secure: true,
              sameSite: 'Strict',
            });
            
            // If user is a store manager and store data exists, store it
            if (data.user.role === 'storemanager' || data.user.role === 'storeadmin' && data.store) {
              Cookies.set('storeId', data.store._id, {
                expires: new Date(data.tokenValidTill),
                secure: true,
                sameSite: 'Strict',
              });
              
              Cookies.set('storeData', JSON.stringify(data.store), {
                expires: new Date(data.tokenValidTill),
                secure: true,
                sameSite: 'Strict',
              });
            }
            
            // Define the role redirect map here before using it
            const roleRedirectMap = {
              storemanager: '/store-dashboard',
              storeadmin: '/store-dashboard',
              superadmin: '/admin-dashboard',
            };
            
            return {
              success: true,
              message,
              user: data.user,
              store: data.store,
              redirectPath: roleRedirectMap[data.user.role] || '/',
            };
          }
          
          return {
            success: false,
            message: message || 'Login failed',
          };
        } catch (error) {
          console.error('Login error details:', error);
          
          // Extract the most useful error message
          let errorMessage = 'An unexpected error occurred';
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return {
            success: false,
            message: errorMessage,
            statusCode: error.response?.status,
          };
        }
      },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('token_expiry');
    Cookies.remove('storeId');
    Cookies.remove('storeData');
    Cookies.remove('userData');
    Cookies.remove('userRole');
  },

  checkTokenValidity: () => {
    const token = Cookies.get('token');
    const tokenExpiry = Cookies.get('token_expiry');

    if (!token || !tokenExpiry) return false;

    try {
      const expiryTime = new Date(tokenExpiry).getTime();
      const currentTime = Date.now();

      if (expiryTime < currentTime) {
        authService.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      authService.logout();
      return false;
    }
  },

  getStoreId: () => {
    return Cookies.get('storeId') || null;
  },

  getStoreData: () => {
    const storeData = Cookies.get('storeData');
    return storeData ? JSON.parse(storeData) : null;
  },

  getUserData: () => {
    const userData = Cookies.get('userData');
    return userData ? JSON.parse(userData) : null;
  },

  getUserRole: () => {
    return Cookies.get('userRole') || null;
  },
};