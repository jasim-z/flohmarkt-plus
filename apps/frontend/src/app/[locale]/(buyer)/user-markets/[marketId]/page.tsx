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
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaArrowLeft,
  FaHeart,
  FaShare,
  FaSearch,
  FaFilter,
  FaThLarge,
  FaListUl,
  FaMap,
  FaClock as FaClockIcon,
  FaFire
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

export default function MarketDetails() {
  const { user, isLoaded, isLoading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [marketDetails, setMarketDetails] = useState<MarketDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    
    const isToday = now.toDateString() === marketDate.toDateString();
    
    if (isToday) {
      if (now < marketStart) {
        return 'Starting Soon';
      } else if (now >= marketStart && now <= marketEnd) {
        return 'Live Now';
      } else {
        return 'Ended Today';
      }
    } else if (now < marketDate) {
      return 'Upcoming';
    } else {
      return 'Past Event';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !marketDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">{error || 'Market not found'}</div>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { market } = marketDetails;
  const status = getMarketStatus(market);
  const StatusIcon = status === 'Upcoming' ? FaClockIcon : (status === 'Live Now' ? FaFire : FaClockIcon);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => router.push(`/${params.locale}/user-markets`)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 border border-white/30"
          >
            <FaArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Back</span>
          </button>
        </div>

        <div className="relative z-10 px-6 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Market Title and Status */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {market.name}
              </h1>
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                <FaClock className="w-4 h-4" />
                <span>{getMarketStatus(market)}</span>
              </div>
            </div>

            {/* Market Description */}
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              {market.description}
            </p>

            {/* Market Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center space-x-3 text-white">
                <FaMapMarkerAlt className="w-5 h-5 text-blue-200 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-200">Location</p>
                  <p className="font-medium">{market.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-white">
                <FaCalendar className="w-5 h-5 text-blue-200 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-200">Date</p>
                  <p className="font-medium">{formatDate(market.date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-white">
                <FaClock className="w-5 h-5 text-blue-200 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-200">Time</p>
                  <p className="font-medium">{market.startTime} - {market.endTime}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-700 rounded-full font-medium hover:bg-gray-100 transition-colors">
                <FaHeart className="w-4 h-4" />
                <span>Save Market</span>
              </button>
              <button className="flex items-center space-x-2 px-6 py-3 bg-white/20 text-white rounded-full font-medium hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30">
                <FaShare className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Vendors Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Explore Vendors
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover unique vendors and their offerings at this flea market
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{marketDetails.statistics.totalVendors}</div>
              <div className="text-sm text-gray-600">Total Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{marketDetails.statistics.verifiedVendors}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{marketDetails.statistics.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FaThLarge className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-700' 
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
                  <div className={`bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center ${
                    viewMode === 'list' ? 'w-16 h-16' : 'w-20 h-20'
                  }`}>
                    {vendor.avatar ? (
                      <img 
                        src={vendor.avatar} 
                        alt={vendor.displayName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <FaStore className={`text-primary-600 ${viewMode === 'list' ? 'w-6 h-6' : 'w-8 h-8'}`} />
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

                  {/* Rating */}
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
                        {vendor.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    {vendor.email && (
                      <div className="flex items-center space-x-1 hover:text-primary-600 transition-colors">
                        <FaEnvelope className="w-3 h-3" />
                        <span>Email</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 hover:text-primary-600 transition-colors">
                      <FaGlobe className="w-3 h-3" />
                      <span>View Profile</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 