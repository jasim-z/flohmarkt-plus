import { authApiClient, ApiError } from '@/app/lib/apiClient';
import { apiErrorHandler } from '@/app/lib/apiErrorHandler';

export async function loginUser(email: string, password: string) {
  try {
    const response = await authApiClient.post('/auth/login', { email, password });
    
    // Store the token in localStorage for cross-origin requests (only on client side)
    if (typeof window !== 'undefined' && response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    
    return response;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function signupUser({
  email,
  password,
  name,
  displayName,
  role,
}: {
  email: string;
  password: string;
  name: string;
  displayName?: string;
  role: 'buyer' | 'seller';
}) {
  try {
    const response = await authApiClient.post('/users', { email, password, name, displayName, role });
    return response;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getCurrentUser() {
  try {
    // Get token from localStorage (only on client side)
    if (typeof window === 'undefined') {
      return null;
    }
    
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return null;
    }
    
    // Add timeout and retry options for getCurrentUser
    const response = await authApiClient.get('/auth/me', { 
      timeout: 5000, // 5 second timeout
      retries: 0 // No retries for getCurrentUser to avoid infinite loading
    });
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    
    // Handle 401 errors by clearing token (only on client side)
    if (apiError.type === 'auth' && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    
    // For network errors, don't clear token - service might be down temporarily
    if (apiError.type === 'network') {
      console.warn('Auth service unavailable, using cached user data if available');
    }
    
    // Don't throw errors for getCurrentUser, just return null
    return null;
  }
} 

export async function logoutUser() {
  try {
    // Remove token from localStorage (only on client side)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    
    const response = await authApiClient.post('/auth/logout');
    return response;
  } catch (error) {
    // Don't throw errors for logout, just clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    return { data: null, status: 200, statusText: 'OK' };
  }
}