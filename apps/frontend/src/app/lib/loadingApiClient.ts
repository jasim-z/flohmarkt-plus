'use client';

import React from 'react';
import { ApiClient } from './apiClient';
import { useGlobalLoading } from '@/app/contexts/LoadingContext';

// Enhanced API client with loading indicators
export class LoadingApiClient extends ApiClient {
  private loadingContext: ReturnType<typeof useGlobalLoading> | null = null;

  constructor(baseURL: string, options: any = {}) {
    super(baseURL, options);
  }

  // Set loading context (to be called from components)
  setLoadingContext(context: ReturnType<typeof useGlobalLoading>) {
    this.loadingContext = context;
  }

  private async executeWithLoading<T>(
    operation: () => Promise<T>,
    message?: string,
    showLoading: boolean = true
  ): Promise<T> {
    if (!showLoading || !this.loadingContext) {
      return operation();
    }

    try {
      this.loadingContext.startLoading(message, 'overlay');
      const result = await operation();
      return result;
    } finally {
      this.loadingContext.stopLoading();
    }
  }

  async get<T>(url: string, options: any = {}): Promise<T> {
    const { showLoading = true, loadingMessage, ...requestOptions } = options;
    
    return this.executeWithLoading(
      () => super.get(url, requestOptions),
      loadingMessage || 'Loading...',
      showLoading
    );
  }

  async post<T>(url: string, data: any, options: any = {}): Promise<T> {
    const { showLoading = true, loadingMessage, ...requestOptions } = options;
    
    return this.executeWithLoading(
      () => super.post(url, data, requestOptions),
      loadingMessage || 'Saving...',
      showLoading
    );
  }

  async put<T>(url: string, data: any, options: any = {}): Promise<T> {
    const { showLoading = true, loadingMessage, ...requestOptions } = options;
    
    return this.executeWithLoading(
      () => super.put(url, data, requestOptions),
      loadingMessage || 'Updating...',
      showLoading
    );
  }

  async patch<T>(url: string, data: any, options: any = {}): Promise<T> {
    const { showLoading = true, loadingMessage, ...requestOptions } = options;
    
    return this.executeWithLoading(
      () => super.patch(url, data, requestOptions),
      loadingMessage || 'Updating...',
      showLoading
    );
  }

  async delete<T>(url: string, options: any = {}): Promise<T> {
    const { showLoading = true, loadingMessage, ...requestOptions } = options;
    
    return this.executeWithLoading(
      () => super.delete(url, requestOptions),
      loadingMessage || 'Deleting...',
      showLoading
    );
  }
}

// Create loading-enabled API clients
export const loadingAuthApiClient = new LoadingApiClient(process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001');
export const loadingMarketsApiClient = new LoadingApiClient(process.env.NEXT_PUBLIC_MARKETS_API_URL || 'http://localhost:3002');
export const loadingMessagesApiClient = new LoadingApiClient(process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3003');
export const loadingListingsApiClient = new LoadingApiClient(process.env.NEXT_PUBLIC_LISTINGS_API_URL || 'http://localhost:3004');
export const loadingOrdersApiClient = new LoadingApiClient(process.env.NEXT_PUBLIC_ORDERS_API_URL || 'http://localhost:3005');
export const loadingUsersApiClient = new LoadingApiClient(process.env.NEXT_PUBLIC_USERS_API_URL || 'http://localhost:3006');

// Hook to initialize loading context for API clients
export function useLoadingApiClients() {
  const loadingContext = useGlobalLoading();

  // Initialize all API clients with loading context
  React.useEffect(() => {
    loadingAuthApiClient.setLoadingContext(loadingContext);
    loadingMarketsApiClient.setLoadingContext(loadingContext);
    loadingMessagesApiClient.setLoadingContext(loadingContext);
    loadingListingsApiClient.setLoadingContext(loadingContext);
    loadingOrdersApiClient.setLoadingContext(loadingContext);
    loadingUsersApiClient.setLoadingContext(loadingContext);
  }, [loadingContext]);

  return {
    loadingAuthApiClient,
    loadingMarketsApiClient,
    loadingMessagesApiClient,
    loadingListingsApiClient,
    loadingOrdersApiClient,
    loadingUsersApiClient
  };
}
