'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { FaShoppingBag, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function BuyerOrders() {
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
              My Orders
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track your purchases and manage your orders from local markets.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShoppingBag className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Orders Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start shopping in local markets to see your orders here. 
            You'll be able to track your purchases and manage your orders.
          </p>
          <button
            onClick={() => router.push(`/${params.locale}/home`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Listings
          </button>
        </div>
      </div>
    </div>
  );
} 