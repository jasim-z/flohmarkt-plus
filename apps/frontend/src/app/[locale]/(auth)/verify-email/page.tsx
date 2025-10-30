"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { authApiClient } from "@/app/lib/apiClient";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { refreshUser, user } = useUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await authApiClient.get(`/auth/verify-email/${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
          
          // If user is logged in, refresh their data to update isVerified status
          if (user) {
            await refreshUser();
          }
          
          // Redirect after 3 seconds
          setTimeout(() => {
            if (user) {
              // If logged in, redirect to appropriate home page
              router.push(`/${params.locale}/${user.role === 'seller' ? 'seller/markets' : 'home'}`);
            } else {
              // If not logged in, redirect to login
              router.push(`/${params.locale}/login`);
            }
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.message);
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [searchParams, router, params.locale, user, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              {user ? 'Redirecting to your dashboard...' : 'Redirecting to login page...'}
            </p>
            <Link 
              href={user ? `/${params.locale}/${user.role === 'seller' ? 'seller/markets' : 'home'}` : `/${params.locale}/login`}
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 underline"
            >
              {user ? 'Go to dashboard now' : 'Go to login now'}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col space-y-3">
              <Link 
                href={`/${params.locale}/login`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </Link>
              <Link 
                href={`/${params.locale}/signup`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Up Again
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


