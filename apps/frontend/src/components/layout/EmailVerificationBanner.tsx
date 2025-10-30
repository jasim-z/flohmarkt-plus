"use client";

import { useState } from "react";
import { FaEnvelope, FaTimes } from "react-icons/fa";

interface EmailVerificationBannerProps {
  userEmail: string;
}

export function EmailVerificationBanner({ userEmail }: EmailVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FaEnvelope className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Please verify your email address
              </p>
              <p className="text-sm text-amber-700">
                We've sent a verification email to <span className="font-semibold">{userEmail}</span>. 
                Click the link in the email to verify your account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 ml-3 inline-flex text-amber-600 hover:text-amber-800 transition-colors"
            aria-label="Dismiss"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


