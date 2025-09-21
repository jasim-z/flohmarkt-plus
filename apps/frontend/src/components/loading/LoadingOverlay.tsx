'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red';
  backdrop?: 'blur' | 'dark' | 'light' | 'none';
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  text = 'Loading...',
  variant = 'spinner',
  size = 'lg',
  color = 'blue',
  backdrop = 'blur',
  className = ''
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  const backdropClasses = {
    blur: 'bg-black bg-opacity-30 backdrop-blur-sm',
    dark: 'bg-black bg-opacity-50',
    light: 'bg-white bg-opacity-80',
    none: 'bg-transparent'
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backdropClasses[backdrop]} ${className}`}>
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm mx-4 text-center">
        <LoadingSpinner
          variant={variant}
          size={size}
          color={color}
          text={text}
        />
      </div>
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
  className?: string;
}

export function PageLoading({ 
  text = 'Loading page...', 
  className = '' 
}: PageLoadingProps) {
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner
          variant="spinner"
          size="xl"
          color="blue"
          text={text}
        />
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({ 
  text, 
  size = 'md',
  className = '' 
}: InlineLoadingProps) {
  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <LoadingSpinner
        variant="spinner"
        size={size}
        color="blue"
        text={text}
      />
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText,
  className = '' 
}: ButtonLoadingProps) {
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <LoadingSpinner
            variant="spinner"
            size="sm"
            color="blue"
            text={loadingText}
          />
        </div>
      )}
      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
}
