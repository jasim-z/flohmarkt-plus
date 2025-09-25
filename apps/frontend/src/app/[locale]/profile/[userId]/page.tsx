'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfileView } from '@/components/business';
import { LoadingSpinner as Loading } from '@/components/loading';

export default function PublicProfile() {
  const { user, isLoaded, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const userId = params.userId as string;

  // Early client-side guard to avoid flicker: if no token, redirect immediately
  useEffect(() => {
    try {
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
      if (!hasToken) {
        router.replace(`/${params.locale}/login`);
      }
    } catch {}
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoaded && user && userId) {
      setIsOwnProfile(user._id === userId);
    }
  }, [user, userId, isLoaded]);

  useEffect(() => {
    if (isLoaded && !isLoading && !user) {
      router.replace(`/${params.locale}/login`);
    }
  }, [user, isLoaded, isLoading, router, params.locale]);

  if (isLoading || !isLoaded) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (isOwnProfile) {
    // Redirect to own profile page based on role
    const profilePath = user.role === 'admin' 
      ? 'profile' 
      : user.role === 'seller' 
      ? 'seller-profile' 
      : 'user-profile';
    
    console.log('Redirecting to profile:', `/${params.locale}/${profilePath}`, 'for user role:', user.role);
    router.replace(`/${params.locale}/${profilePath}`);
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
          <p className="text-gray-600">View user information and activity</p>
        </div>
        
        <ProfileView 
          userId={userId} 
          isOwnProfile={false}
          viewerRole={user.role as 'buyer' | 'seller' | 'admin'}
        />
      </div>
    </div>
  );
}