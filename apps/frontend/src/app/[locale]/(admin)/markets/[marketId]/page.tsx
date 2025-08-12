'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaPhone, FaEnvelope, FaUserShield } from "react-icons/fa";
import { Market, getMarkets } from "../../../../api/markets";
import { User } from "../../../../api/users";

export default function MarketDetail() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<User[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch market data by getting all markets and finding the specific one
        const response = await getMarkets();
        const foundMarket = response.data.find(m => m._id === params.marketId);
        
        if (!foundMarket) {
          throw new Error('Market not found');
        }
        
        setMarket(foundMarket);
        
        // For now, we'll use mock vendor data since we don't have a vendors API yet
        // In the future, you can create a getVendorsByMarket API endpoint
        setVendors([]);
        setVendorsLoading(false);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    if (params.marketId) {
      fetchMarketData();
    }
  }, [params.marketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>Back to Markets</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <FaTimesCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {error?.includes('not found') ? 'Market Not Found' : 'Error Loading Market'}
                </h3>
                <p className="text-gray-600">
                  {error || 'The requested market could not be found or loaded.'}
                </p>
                {error?.includes('not found') && (
                  <p className="text-sm text-gray-500 mt-2">
                    The market ID &quot;{params.marketId}&quot; doesn&apos;t exist in the system.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Market['status']) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Market['status']) => {
    switch (status) {
      case 'ongoing':
        return 'Ongoing';
      case 'upcoming':
        return 'Upcoming';
      case 'past':
        return 'Past';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span>Back to Markets</span>
        </button>

        {/* Market Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start space-x-6">
            {/* Market Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <FaStore className="h-12 w-12 text-white" />
            </div>
            
            {/* Market Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{market.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(market.status)}`}>
                  {getStatusLabel(market.status)}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  market.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {market.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-gray-600 text-lg mb-6">{market.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{market.location}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCalendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDate(market.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaClock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatTime(market.startTime)} - {formatTime(market.endTime)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaUsers className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {market.registeredVendors.length} vendors registered
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaStore className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {market.boothsAvailable || 0} booths available
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaUserShield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      Vendor limit: {market.vendorLimit || 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Categories */}
        {market.categories && market.categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Categories</h2>
            <div className="flex flex-wrap gap-2">
              {market.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Registered Vendors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Registered Vendors</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <FaUsers className="h-5 w-5" />
              <span>{market.registeredVendors.length} vendors</span>
            </div>
          </div>

          {vendorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : market.registeredVendors.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Vendors Registered Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This market doesn&apos;t have any registered vendors yet. Vendors can register through the market application process.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <FaExclamationTriangle className="h-4 w-4 text-blue-500" />
                  <span>Vendors can register for this market through the Markets section</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* This would show actual vendor data when we have the API */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="text-center text-gray-500">
                  <FaUsers className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Vendor details would be displayed here</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 