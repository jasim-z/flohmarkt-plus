'use client';

import { useState } from 'react';
import { ApiErrorNotification, useApiErrorNotification } from './ApiErrorNotification';
import { authApiClient, marketsApiClient, messagesApiClient } from '@/app/lib/apiClient';
import { ApiError } from '@/app/lib/apiErrorHandler';

export default function ApiErrorTestComponent() {
  const { error, showError, clearError, handleRetry } = useApiErrorNotification();
  const [loading, setLoading] = useState<string | null>(null);

  const testApiCall = async (apiCall: () => Promise<any>, testName: string) => {
    setLoading(testName);
    try {
      await apiCall();
    } catch (err) {
      if (err instanceof Error && 'type' in err) {
        showError(err as ApiError);
      } else {
        showError({
          type: 'unknown',
          message: 'Unknown error occurred',
          retryable: false
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const testCases = [
    {
      name: 'Network Error',
      description: 'Test network connection failure',
      action: () => testApiCall(
        () => fetch('http://invalid-url-that-will-fail.com/api/test'),
        'Network Error'
      )
    },
    {
      name: '401 Unauthorized',
      description: 'Test authentication error',
      action: () => testApiCall(
        () => authApiClient.get('/auth/me', { headers: { 'Authorization': 'Bearer invalid-token' } }),
        '401 Unauthorized'
      )
    },
    {
      name: '404 Not Found',
      description: 'Test resource not found error',
      action: () => testApiCall(
        () => marketsApiClient.get('/markets/non-existent-market-id'),
        '404 Not Found'
      )
    },
    {
      name: '500 Server Error',
      description: 'Test server error (will retry)',
      action: () => testApiCall(
        () => fetch('http://httpstat.us/500'),
        '500 Server Error'
      )
    },
    {
      name: 'Timeout Error',
      description: 'Test request timeout',
      action: () => testApiCall(
        () => marketsApiClient.get('/markets', { timeout: 1000 }),
        'Timeout Error'
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">API Error Handling Test</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {testCases.map((testCase, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">{testCase.name}</h3>
            <p className="text-gray-600 mb-4">{testCase.description}</p>
            <button
              onClick={testCase.action}
              disabled={loading === testCase.name}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === testCase.name ? 'Testing...' : 'Test Error'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Error Handling Features</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Automatic retry for transient errors (5xx, network issues)</li>
          <li>User-friendly error messages for different error types</li>
          <li>Toast notifications with retry buttons</li>
          <li>Automatic redirect for auth errors (401)</li>
          <li>Automatic redirect for permission errors (403)</li>
          <li>Error logging to console for debugging</li>
          <li>Request timeout handling</li>
          <li>Exponential backoff for retries</li>
        </ul>
      </div>

      {/* Error Notification Component */}
      <ApiErrorNotification
        error={error}
        onRetry={() => handleRetry(() => {
          console.log('Retry clicked');
          clearError();
        })}
        onDismiss={clearError}
        showToast={true}
      />
    </div>
  );
}
