'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GlobalLoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  type?: 'overlay' | 'inline' | 'page';
}

interface LoadingContextType {
  loadingState: GlobalLoadingState;
  startLoading: (message?: string, type?: 'overlay' | 'inline' | 'page') => void;
  stopLoading: () => void;
  updateProgress: (progress: number) => void;
  updateMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<GlobalLoadingState>({
    isLoading: false,
    message: undefined,
    progress: undefined,
    type: 'overlay'
  });

  const startLoading = useCallback((message?: string, type: 'overlay' | 'inline' | 'page' = 'overlay') => {
    setLoadingState({
      isLoading: true,
      message,
      progress: undefined,
      type
    });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined,
      type: 'overlay'
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100)
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        loadingState,
        startLoading,
        stopLoading,
        updateProgress,
        updateMessage
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}
