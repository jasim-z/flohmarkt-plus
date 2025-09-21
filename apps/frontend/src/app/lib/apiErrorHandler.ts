// API Error Types and Handler
export interface ApiError {
  type: 'network' | 'auth' | 'permission' | 'not_found' | 'server' | 'validation' | 'unknown';
  status?: number;
  message: string;
  originalError?: Error;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: any;
  statusCode?: number;
}

// Error message mappings
const ERROR_MESSAGES = {
  network: 'Connection failed, please try again',
  auth: 'Please log in to continue',
  permission: 'You don\'t have permission to perform this action',
  not_found: 'Resource not found',
  server: 'Server error, please try later',
  validation: 'Please check your input and try again',
  unknown: 'Something went wrong, please try again'
} as const;

// Retryable status codes (transient errors)
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Retry delays in milliseconds
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private retryAttempts = new Map<string, number>();

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  /**
   * Handle API errors and return structured error information
   */
  handleError(error: any, requestId?: string): ApiError {
    console.error('API Error:', error);

    // Network errors (no response)
    if (!error.response && (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch'))) {
      return {
        type: 'network',
        message: ERROR_MESSAGES.network,
        originalError: error,
        retryable: true
      };
    }

    // HTTP response errors
    if (error.response) {
      const status = error.response.status;
      const data: ApiErrorResponse = error.response.data || {};

      // 401 - Unauthorized
      if (status === 401) {
        return {
          type: 'auth',
          status,
          message: ERROR_MESSAGES.auth,
          originalError: error,
          retryable: false
        };
      }

      // 403 - Forbidden
      if (status === 403) {
        return {
          type: 'permission',
          status,
          message: ERROR_MESSAGES.permission,
          originalError: error,
          retryable: false
        };
      }

      // 404 - Not Found
      if (status === 404) {
        return {
          type: 'not_found',
          status,
          message: ERROR_MESSAGES.not_found,
          originalError: error,
          retryable: false
        };
      }

      // 422 - Validation Error
      if (status === 422) {
        return {
          type: 'validation',
          status,
          message: data.message || ERROR_MESSAGES.validation,
          originalError: error,
          retryable: false
        };
      }

      // 5xx - Server Errors
      if (status >= 500) {
        return {
          type: 'server',
          status,
          message: ERROR_MESSAGES.server,
          originalError: error,
          retryable: RETRYABLE_STATUS_CODES.includes(status),
          retryAfter: status === 429 ? 60 : undefined // Rate limiting
        };
      }

      // Other HTTP errors
      return {
        type: 'unknown',
        status,
        message: data.message || ERROR_MESSAGES.unknown,
        originalError: error,
        retryable: RETRYABLE_STATUS_CODES.includes(status)
      };
    }

    // Unknown error
    return {
      type: 'unknown',
      message: ERROR_MESSAGES.unknown,
      originalError: error,
      retryable: false
    };
  }

  /**
   * Check if an error should be retried
   */
  shouldRetry(error: ApiError, requestId?: string): boolean {
    if (!error.retryable) return false;
    
    if (requestId) {
      const attempts = this.retryAttempts.get(requestId) || 0;
      return attempts < RETRY_DELAYS.length;
    }
    
    return true;
  }

  /**
   * Get retry delay for the next attempt
   */
  getRetryDelay(error: ApiError, requestId?: string): number {
    if (!requestId) return RETRY_DELAYS[0];
    
    const attempts = this.retryAttempts.get(requestId) || 0;
    return RETRY_DELAYS[attempts] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  }

  /**
   * Record a retry attempt
   */
  recordRetryAttempt(requestId: string): void {
    const attempts = this.retryAttempts.get(requestId) || 0;
    this.retryAttempts.set(requestId, attempts + 1);
  }

  /**
   * Clear retry attempts for a request
   */
  clearRetryAttempts(requestId: string): void {
    this.retryAttempts.delete(requestId);
  }

  /**
   * Handle authentication errors (redirect to login)
   */
  handleAuthError(): void {
    // Clear auth token
    localStorage.removeItem('auth_token');
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Handle permission errors (redirect to unauthorized)
   */
  handlePermissionError(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance();
