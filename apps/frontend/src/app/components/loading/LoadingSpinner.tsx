'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  color = 'blue',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'border-blue-600 text-blue-600',
    gray: 'border-gray-600 text-gray-600',
    white: 'border-white text-white',
    green: 'border-green-600 text-green-600',
    red: 'border-red-600 text-red-600'
  };

  const renderSpinner = () => {
    const baseClasses = `${sizeClasses[size]} ${colorClasses[color]}`;

    switch (variant) {
      case 'spinner':
        return (
          <div className={`animate-spin rounded-full border-2 border-t-transparent ${baseClasses}`}></div>
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`bg-current rounded-full animate-bounce ${sizeClasses[size]}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`bg-current rounded-full animate-pulse ${sizeClasses[size]}`}></div>
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`bg-current rounded-sm animate-pulse ${sizeClasses[size]}`}
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  height: `${(i + 1) * 0.25}rem`
                }}
              ></div>
            ))}
          </div>
        );
      
      case 'ring':
        return (
          <div className={`animate-spin rounded-full border-2 border-t-transparent border-r-transparent ${baseClasses}`}></div>
        );
      
      default:
        return (
          <div className={`animate-spin rounded-full border-2 border-t-transparent ${baseClasses}`}></div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      {renderSpinner()}
      {text && (
        <p className={`text-sm font-medium ${colorClasses[color].split(' ')[1]}`}>
          {text}
        </p>
      )}
    </div>
  );
}
