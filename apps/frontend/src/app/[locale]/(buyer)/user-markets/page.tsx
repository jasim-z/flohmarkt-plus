'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaStore } from 'react-icons/fa';

interface Market {
  _id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  bannerImage?: string;
  categories: string[];
  vendorLimit: number;
  boothsAvailable: number;
  registeredVendors: string[];
  isActive: boolean;
  status: string;
}

export default function BuyerMarkets() {
  const { user, isLoaded, isLoading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (isLoaded && !authLoading) {
      if (!user) {
        router.replace(`/${params.locale}/login`);
      } else if (user.role === 'seller') {
        router.replace(`/${params.locale}/overview`);
      } else if (user.role === 'admin') {
        router.replace(`/${params.locale}/dashboard`);
      }
    }
  }, [user, isLoaded, authLoading, router, params.locale]);

  // Fetch markets
  useEffect(() => {
    if (user && user.role === 'buyer') {
      fetchMarkets();
    }
  }, [user]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3953/markets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      
      const data = await response.json();
      setMarkets(data.data || data);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMarketStatus = (market: Market) => {
    const now = new Date();
    const marketDate = new Date(market.date);
    const marketStart = new Date(`${market.date}T${market.startTime}`);
    const marketEnd = new Date(`${market.date}T${market.endTime}`);
    
    if (now < marketStart) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= marketStart && now <= marketEnd) {
      return { status: 'live', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'ended', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Loading state
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

  // Not authenticated
  if (!user || user.role !== 'buyer') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Local Markets
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover flea markets, farmers markets, and community events in your area. 
              Find unique items and support local vendors.
            </p>
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg font-semibold mb-2">{error}</div>
            <button
              onClick={fetchMarkets}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg font-semibold mb-2">
              No markets available at the moment
            </div>
            <p className="text-gray-400">
              Check back later for new markets and events
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => {
              const status = getMarketStatus(market);
              return (
                <div key={market._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Banner Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    {market.bannerImage ? (
                      <img 
                        src={market.bannerImage} 
                        alt={market.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaStore className="w-16 h-16 text-blue-400" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {market.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.status}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {market.description}
                    </p>
                    
                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-red-500" />
                        <span className="truncate">{market.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendar className="w-4 h-4 mr-2 text-blue-500" />
                        <span>{formatDate(market.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="w-4 h-4 mr-2 text-green-500" />
                        <span>{market.startTime} - {market.endTime}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="w-4 h-4 mr-2 text-purple-500" />
                        <span>{market.registeredVendors.length} / {market.vendorLimit} vendors</span>
                      </div>
                    </div>
                    
                    {/* Categories */}
                    {market.categories.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {market.categories.slice(0, 3).map((category, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                          {market.categories.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{market.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/${params.locale}/markets/${market._id}`)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      View Market
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 