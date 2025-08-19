'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { FaEnvelope, FaComments, FaUser } from 'react-icons/fa';

export default function BuyerMessages() {
  const { user, isLoaded, isLoading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();

  // Check authentication
  if (isLoaded && !authLoading) {
    if (!user) {
      router.replace(`/${params.locale}/login`);
      return null;
    } else if (user.role === 'seller') {
      router.replace(`/${params.locale}/overview`);
      return null;
    } else if (user.role === 'admin') {
      router.replace(`/${params.locale}/dashboard`);
      return null;
    }
  }

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Messages
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Communicate with sellers about items, negotiate prices, and coordinate pickups.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Messages Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start conversations with sellers about items you're interested in. 
            You'll be able to ask questions, negotiate prices, and coordinate pickups.
          </p>
          <button
            onClick={() => router.push(`/${params.locale}/home`)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Browse Listings
          </button>
        </div>
      </div>
    </div>
  );
} 