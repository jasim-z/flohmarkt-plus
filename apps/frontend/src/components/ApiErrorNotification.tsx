'use client';

import { useState, useEffect } from 'react';
import { ApiError } from '@/app/lib/apiErrorHandler';
import toast from 'react-hot-toast';

interface ApiErrorNotificationProps {
  error: ApiError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showToast?: boolean;
}

export function ApiErrorNotification({ 
  error, 
  onRetry, 
  onDismiss, 
  showToast = true 
}: ApiErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (showToast) {
        // Show toast notification
        const toastOptions = {
          duration: error.type === 'network' ? 5000 : 4000,
          icon: getErrorIcon(error.type),
          style: {
            background: getErrorColor(error.type),
            color: '#fff',
          },
        };

        if (error.retryable && onRetry) {
          toast.error(
            (t) => (
              <div className="flex items-center justify-between">
                <span>{error.message}</span>
                <button
                  onClick={() => {
                    onRetry();
                    toast.dismiss(t.id);
                  }}
                  className="ml-4 px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-colors"
                >
                  Retry
                </button>
              </div>
            ),
            toastOptions
          );
        } else {
          toast.error(error.message, toastOptions);
        }
      }
    } else {
      setIsVisible(false);
    }
  }, [error, onRetry, showToast]);

  if (!error || !isVisible) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${isVisible ? 'animate-in slide-in-from-right' : 'animate-out slide-out-to-right'}`}>
      <div className={`p-4 rounded-lg shadow-lg border-l-4 ${getErrorColorClass(error.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getErrorIcon(error.type)}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {getErrorTitle(error.type)}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {error.message}
            </p>
            {error.status && (
              <p className="mt-1 text-xs text-gray-500">
                Error {error.status}
              </p>
            )}
            <div className="mt-3 flex space-x-2">
              {error.retryable && onRetry && (
                <button
                  onClick={handleRetry}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getErrorIcon(type: ApiError['type']) {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'network':
      return (
        <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    case 'auth':
      return (
        <svg className={`${iconClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'permission':
      return (
        <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      );
    case 'not_found':
      return (
        <svg className={`${iconClass} text-orange-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6H9a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2z" />
        </svg>
      );
    case 'server':
      return (
        <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'validation':
      return (
        <svg className={`${iconClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    default:
      return (
        <svg className={`${iconClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getErrorColor(type: ApiError['type']): string {
  switch (type) {
    case 'network':
      return '#ef4444'; // red-500
    case 'auth':
      return '#f59e0b'; // amber-500
    case 'permission':
      return '#dc2626'; // red-600
    case 'not_found':
      return '#f97316'; // orange-500
    case 'server':
      return '#dc2626'; // red-600
    case 'validation':
      return '#f59e0b'; // amber-500
    default:
      return '#6b7280'; // gray-500
  }
}

function getErrorColorClass(type: ApiError['type']): string {
  switch (type) {
    case 'network':
      return 'bg-red-50 border-red-400';
    case 'auth':
      return 'bg-yellow-50 border-yellow-400';
    case 'permission':
      return 'bg-red-50 border-red-400';
    case 'not_found':
      return 'bg-orange-50 border-orange-400';
    case 'server':
      return 'bg-red-50 border-red-400';
    case 'validation':
      return 'bg-yellow-50 border-yellow-400';
    default:
      return 'bg-gray-50 border-gray-400';
  }
}

function getErrorTitle(type: ApiError['type']): string {
  switch (type) {
    case 'network':
      return 'Connection Error';
    case 'auth':
      return 'Authentication Required';
    case 'permission':
      return 'Access Denied';
    case 'not_found':
      return 'Not Found';
    case 'server':
      return 'Server Error';
    case 'validation':
      return 'Validation Error';
    default:
      return 'Error';
  }
}

// Hook for using API error notifications
export function useApiErrorNotification() {
  const [error, setError] = useState<ApiError | null>(null);

  const showError = (apiError: ApiError) => {
    setError(apiError);
  };

  const clearError = () => {
    setError(null);
  };

  const handleRetry = (retryFn: () => void) => {
    retryFn();
    clearError();
  };

  return {
    error,
    showError,
    clearError,
    handleRetry
  };
}
