'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { ProfileView } from '@/components/business';
import { LoadingSpinner as Loading } from '@/components/loading';

export default function SellerProfile() {
  const { user, isLoaded, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (isLoaded && !isLoading) {
      if (!user) {
        router.replace(`/${params.locale}/login`);
      }
    }
  }, [user, isLoaded, isLoading, router, params.locale]);

  if (isLoading || !isLoaded) {
    return <Loading />;
  }

  if (!user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Seller Profile</h1>
          <p className="text-gray-600">Manage your seller account and showcase your business</p>
        </div>
        
        <ProfileView 
          userId={user._id} 
          isOwnProfile={true}
          viewerRole="seller"
        />
      </div>
    </div>
  );
}