'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  size = 'md',
  variant = 'default',
  showPercentage = true,
  animated = true,
  className = ''
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${variantClasses[variant]} ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-medium text-gray-900">{clampedProgress}%</span>
        </div>
      )}
    </div>
  );
}

interface CircularProgressProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 'md',
  variant = 'default',
  showPercentage = true,
  className = ''
}: CircularProgressProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const variantClasses = {
    default: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-500',
    error: 'text-red-600'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = size === 'sm' ? 12 : size === 'md' ? 18 : size === 'lg' ? 24 : 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`0 0 ${radius * 2 + 4} ${radius * 2 + 4}`}
      >
        {/* Background circle */}
        <circle
          cx={radius + 2}
          cy={radius + 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={radius + 2}
          cy={radius + 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-out ${variantClasses[variant]}`}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-medium ${variantClasses[variant]}`}>
            {clampedProgress}%
          </span>
        </div>
      )}
    </div>
  );
}
