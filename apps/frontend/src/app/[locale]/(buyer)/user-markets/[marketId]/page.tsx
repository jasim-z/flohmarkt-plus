'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaMapMarkerAlt, 
  FaCalendar, 
  FaClock, 
  FaUsers, 
  FaStore, 
  FaStar,
  FaArrowLeft,
  FaHeart,
  FaShare,
  FaSearch,
  FaThLarge,
  FaListUl,
  FaCheck,
  FaInfoCircle,
  FaTimes
} from 'react-icons/fa';
import { getMarketDetails, Market, Vendor } from '@/app/api/markets';

interface MarketDetailsResponse {
  market: Market;
  vendors: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    totalVendors: number;
    activeVendors: number;
    verifiedVendors: number;
    averageRating: number;
  };
}

// Utility function to calculate market status based on current date/time
const calculateMarketStatus = (market: Market): 'upcoming' | 'ongoing' | 'past' => {
  const now = new Date();
  const marketDate = new Date(market.date);
  
  // If market date is in the future, it's upcoming
  if (marketDate > now) {
    return 'upcoming';
  }
  
  // If market date is today, check the time
  if (marketDate.toDateString() === now.toDateString()) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHours, startMinutes] = market.startTime.split(':').map(Number);
    const [endHours, endMinutes] = market.endTime.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;
    
    if (currentTime < startTimeInMinutes) {
      return 'upcoming';
    } else if (currentTime >= startTimeInMinutes && currentTime < endTimeInMinutes) {
      return 'ongoing';
    } else {
      return 'past';
    }
  }
  
  // If market date is in the past, it's past
  return 'past';
};

export default function MarketDetails() {
  const { user, isLoaded, isLoading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [marketDetails, setMarketDetails] = useState<MarketDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fetch market details
  useEffect(() => {
    if (user && user.role === 'buyer' && params.marketId) {
      fetchMarketDetails();
    }
  }, [user, params.marketId]);

  const fetchMarketDetails = async () => {
    try {
      setLoading(true);
      const response = await getMarketDetails(params.marketId as string);
      setMarketDetails(response);
    } catch (err) {
      console.error('Error fetching market details:', err);
      setError('Failed to load market details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: 'upcoming' | 'ongoing' | 'past') => {
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

  const getStatusLabel = (status: 'upcoming' | 'ongoing' | 'past') => {
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

  const filteredVendors = marketDetails?.vendors.filter(vendor =>
    vendor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Loading state
  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-4"></div>
            <div className="h-48 sm:h-64 bg-gray-200 rounded mb-4 sm:mb-6"></div>
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user || user.role !== 'buyer') {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-4"></div>
            <div className="h-48 sm:h-64 bg-gray-200 rounded mb-4 sm:mb-6"></div>
            <div className="h-24 sm:h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !marketDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors duration-200"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">Back to Markets</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="h-6 w-6 text-red-500 flex-shrink-0">
                <FaTimes className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {error?.includes('not found') ? 'Market Not Found' : 'Error Loading Market'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {error || 'The requested market could not be found or loaded.'}
                </p>
                {error?.includes('not found') && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
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

  const { market } = marketDetails;
  const status = calculateMarketStatus(market);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${params.locale}/user-markets`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors duration-200"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span className="text-sm sm:text-base">Back to Markets</span>
        </button>

        {/* Market Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Market Image */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {market.bannerImage ? (
                <img 
                  src={market.bannerImage} 
                  alt={market.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback Icon */}
              <div 
                className={`flex items-center justify-center ${market.bannerImage ? 'hidden' : 'flex'}`}
                style={{ display: market.bannerImage ? 'none' : 'flex' }}
              >
                <FaStore className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
              </div>
            </div>
            
            {/* Market Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{market.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    market.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {market.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex-shrink-0 ml-auto">
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                      <FaHeart className="w-4 h-4" />
                      <span>Save Market</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium">
                      <FaShare className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6 break-words">{market.description}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                  <FaCalendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatDate(market.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 break-words">{market.location}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                  <FaClock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatTime(market.startTime)} - {formatTime(market.endTime)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
              {market.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium break-words"
                >
                  {category}
                </span>
              ))}
            </div>
            </div>
          </div>
        </div>

        {/* Market Statistics Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Market Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{marketDetails.statistics.totalVendors}</div>
              <div className="text-sm text-gray-600">Total Vendors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{marketDetails.statistics.verifiedVendors}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{marketDetails.statistics.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Explore Vendors Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Explore Vendors</h2>
              <p className="text-sm text-gray-600">
                Discover unique vendors and their offerings at this flea market
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FaThLarge className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FaListUl className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Vendors Grid/List */}
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <FaStore className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor._id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer ${
                    viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                  }`}
                >
                  {/* Vendor Avatar */}
                  <div className={`${viewMode === 'list' ? 'mr-4' : 'mb-4'}`}>
                    <div className={`bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center ${
                      viewMode === 'list' ? 'w-16 h-16' : 'w-20 h-20'
                    }`}>
                      {vendor.avatar ? (
                        <img 
                          src={vendor.avatar} 
                          alt={vendor.displayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <FaStore className={`text-blue-600 ${viewMode === 'list' ? 'w-6 h-6' : 'w-8 h-8'}`} />
                      )}
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {vendor.displayName}
                      </h3>
                      {vendor.isVerified && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    {vendor.city && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <FaMapMarkerAlt className="w-3 h-3 mr-1 text-red-500" />
                        <span>{vendor.city}{vendor.neighborhood && `, ${vendor.neighborhood}`}</span>
                      </div>
                    )}

                    {/* Rating with Total Reviews */}
                    {vendor.rating && (
                      <div className="flex items-center space-x-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < Math.floor(vendor.rating!) 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {vendor.rating.toFixed(1)} ({vendor.totalReviews || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Total Sales */}
                    <div className="flex items-center space-x-2 mb-3">
                      <FaStore className="w-3 h-3 text-green-500" />
                      <span className="text-sm text-gray-600">
                        {vendor.totalSales || 0} sales
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {vendor.isVerified && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Verified
                        </span>
                      )}
                      {vendor.badges && vendor.badges.length > 0 && (
                        vendor.badges.slice(0, 3).map((badge, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                          >
                            {badge}
                          </span>
                        ))
                      )}
                      {/* Mock badges for demonstration - remove in production */}
                      {(!vendor.badges || vendor.badges.length === 0) && (
                        <>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            Top Seller
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Fast Shipping
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 