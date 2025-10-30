import { apiErrorHandler, ApiError } from './apiErrorHandler';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  retries?: number;
  timeout?: number;
  requestId?: string;
  skipAuthRedirect?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set base URL for the API client
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Add authorization header
   */
  setAuthToken(token: string): void {
    this.setDefaultHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Remove authorization header
   */
  clearAuthToken(): void {
    const { Authorization, ...headers } = this.defaultHeaders;
    this.defaultHeaders = headers;
  }

  /**
   * Make an API request with retry logic
   */
  async request<T = any>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      retries = 1, // Reduced from 3 to 1 for faster failure
      timeout = 10000, // Reduced from 30000 to 10000 for faster failure
      requestId = this.generateRequestId()
    } = options;

    const fullUrl = this.baseURL ? `${this.baseURL}${url}` : url;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    // Add auth token if available (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && !requestHeaders.Authorization) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include',
    };

    if (body) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle successful response
        if (response.ok) {
          // Clear retry attempts on success
          apiErrorHandler.clearRetryAttempts(requestId);

          let data: T;
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text() as T;
          }

          return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          };
        }

        // Handle error response
        const errorData = await this.parseErrorResponse(response);
        const error = {
          response: {
            status: response.status,
            data: errorData
          }
        };

        lastError = apiErrorHandler.handleError(error, requestId);

        // Handle specific error types
        if (lastError.type === 'auth') {
          // Only auto-redirect if not explicitly disabled
          if (!options.skipAuthRedirect) {
            apiErrorHandler.handleAuthError();
          }
          throw lastError;
        }

        if (lastError.type === 'permission') {
          // Allow callers to skip permission redirect using skipAuthRedirect as a general skip flag
          if (!(options as any).skipAuthRedirect) {
            apiErrorHandler.handlePermissionError();
          }
          throw lastError;
        }

        // Check if we should retry
        if (attempt < retries && apiErrorHandler.shouldRetry(lastError, requestId)) {
          const delay = Math.min(apiErrorHandler.getRetryDelay(lastError, requestId), 2000); // Max 2 second delay
          apiErrorHandler.recordRetryAttempt(requestId);
          
          console.log(`Retrying request in ${delay}ms (attempt ${attempt + 1}/${retries})`);
          await this.delay(delay);
          continue;
        }

        // No more retries, throw the error
        throw lastError;

      } catch (error: any) {
        // Handle network errors or other fetch errors
        if (error.name === 'AbortError') {
          lastError = {
            type: 'network',
            message: 'Request timeout, please try again',
            originalError: error,
            retryable: true
          };
        } else if (!error.response) {
          lastError = {
            type: 'network',
            message: 'Connection failed, please try again',
            originalError: error,
            retryable: true
          };
        } else {
          lastError = apiErrorHandler.handleError(error, requestId);
        }

        // Check if we should retry
        if (attempt < retries && apiErrorHandler.shouldRetry(lastError, requestId)) {
          const delay = Math.min(apiErrorHandler.getRetryDelay(lastError, requestId), 2000); // Max 2 second delay
          apiErrorHandler.recordRetryAttempt(requestId);
          
          console.log(`Retrying request in ${delay}ms (attempt ${attempt + 1}/${retries})`);
          await this.delay(delay);
          continue;
        }

        // No more retries, throw the error
        throw lastError;
      }
    }

    // This should never be reached, but just in case
    throw lastError || {
      type: 'unknown',
      message: 'Request failed after all retries',
      retryable: false
    };
  }

  /**
   * Parse error response from server
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return { message: await response.text() };
      }
    } catch {
      return { message: 'Unknown error occurred' };
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  async put<T = any>(url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// Create default API client instances for different services
export const authApiClient = new ApiClient(process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3950');
export const messagesApiClient = new ApiClient(process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954');
export const marketsApiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953');
export const listingsApiClient = new ApiClient(process.env.NEXT_PUBLIC_LISTINGS_API_URL || 'http://localhost:3952');
export const ordersApiClient = new ApiClient(process.env.NEXT_PUBLIC_ORDERS_API_URL || 'http://localhost:3949');
export const usersApiClient = new ApiClient(process.env.NEXT_PUBLIC_USERS_API_URL || 'http://localhost:3950');

// Export default client
export const apiClient = new ApiClient();
