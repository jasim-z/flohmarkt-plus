'use client';

import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfo } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 5000 }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck className="h-5 w-5 text-green-500" />;
      case 'error':
        return <FaTimes className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <FaInfo className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`${getBackgroundColor()} border rounded-lg p-4 shadow-lg max-w-sm transition-all duration-300 ${
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsAnimating(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 