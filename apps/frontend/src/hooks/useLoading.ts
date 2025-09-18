'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface UseLoadingOptions {
  delay?: number; // Delay before showing loading (ms)
  timeout?: number; // Timeout for loading (ms)
  onTimeout?: () => void;
}

export function useLoading(options: UseLoadingOptions = {}) {
  const { delay = 500, timeout, onTimeout } = options;
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    progress: undefined
  });
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const delayRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback((message?: string, progress?: number) => {
    // Clear any existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayRef.current) clearTimeout(delayRef.current);

    // Set loading state immediately if no delay
    if (delay === 0) {
      setLoadingState({
        isLoading: true,
        message,
        progress
      });
    } else {
      // Delay showing loading indicator
      delayRef.current = setTimeout(() => {
        setLoadingState({
          isLoading: true,
          message,
          progress
        });
      }, delay);
    }

    // Set timeout if provided
    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        onTimeout?.();
      }, timeout);
    }
  }, [delay, timeout, onTimeout]);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayRef.current) clearTimeout(delayRef.current);
    
    setLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      message: message || prev.message
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage
  };
}

// Hook for API calls with automatic loading management
export function useApiLoading(options: UseLoadingOptions = {}) {
  const loading = useLoading(options);

  const executeWithLoading = useCallback(async <T>(
    apiCall: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      loading.startLoading(message);
      const result = await apiCall();
      return result;
    } finally {
      loading.stopLoading();
    }
  }, [loading]);

  return {
    ...loading,
    executeWithLoading
  };
}

// Hook for file uploads with progress
export function useUploadLoading(options: UseLoadingOptions = {}) {
  const loading = useLoading(options);

  const uploadWithProgress = useCallback(async <T>(
    uploadCall: (onProgress: (progress: number) => void) => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      loading.startLoading(message, 0);
      
      const result = await uploadCall((progress) => {
        loading.updateProgress(progress);
      });
      
      loading.updateProgress(100);
      return result;
    } finally {
      // Keep loading for a moment to show 100% completion
      setTimeout(() => {
        loading.stopLoading();
      }, 500);
    }
  }, [loading]);

  return {
    ...loading,
    uploadWithProgress
  };
}
