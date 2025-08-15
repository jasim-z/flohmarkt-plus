'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaUserShield, FaStar, FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Market, getMarkets, getVendorsByMarket, Vendor, GetVendorsParams, toggleMarketActive } from "../../../../api/markets";

// Utility function to calculate market status based on current date/time
// This approach is more efficient than backend calculation because:
// 1. No additional API calls needed
// 2. Real-time accuracy without database queries
// 3. Scales to any number of markets
// 4. Updates automatically as time passes
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

// Vendor Card Component
function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {vendor.avatar ? (
            <Image 
              src={vendor.avatar} 
              alt={vendor.displayName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {vendor.displayName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        {/* Vendor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {vendor.displayName}
            </h3>
            {vendor.isVerified && (
              <FaCheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{vendor.email}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {vendor.city && (
              <div className="flex items-center space-x-1">
                <FaMapMarkerAlt className="h-3 w-3" />
                <span>{vendor.city}</span>
              </div>
            )}
            {vendor.rating && (
              <div className="flex items-center space-x-1">
                <FaStar className="h-3 w-3 text-yellow-500" />
                <span>{vendor.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {vendor.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MarketDetail() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [vendorsPagination, setVendorsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusUpdateTrigger, setStatusUpdateTrigger] = useState(0);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Debounce search term for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Timer to update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fetchVendors = useCallback(async () => {
    if (!market?._id) return;
    
    try {
      setVendorsLoading(true);
      setVendorsError(null);
      
      const params: GetVendorsParams = {
        page: vendorsPagination.page,
        limit: vendorsPagination.limit,
        search: debouncedSearchTerm || undefined,
        sortBy,
        sortOrder,
      };
      
      const response = await getVendorsByMarket(market._id, params);
      setVendors(response.data);
      setVendorsPagination(response.pagination);
    } catch (err) {
      setVendorsError(err instanceof Error ? err.message : 'Failed to fetch vendors');
      // Reset vendors on error
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }, [market?._id, vendorsPagination.page, vendorsPagination.limit, debouncedSearchTerm, sortBy, sortOrder]);

  // Performance optimization: Only fetch vendors when market changes
  useEffect(() => {
    if (market?._id && market.registeredVendors.length > 0) {
      fetchVendors();
    } else if (market?._id && market.registeredVendors.length === 0) {
      setVendors([]);
      setVendorsLoading(false);
      setVendorsPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
    }
  }, [market?._id, market?.registeredVendors.length, fetchVendors]);

  // Separate effect for search, sort, and pagination changes
  useEffect(() => {
    if (market?._id && market.registeredVendors.length > 0) {
      fetchVendors();
    }
  }, [debouncedSearchTerm, sortBy, sortOrder, vendorsPagination.page, fetchVendors]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setVendorsPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setVendorsPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setVendorsPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleToggleActive = useCallback(async () => {
    if (!market) return;
    
    try {
      setToggleLoading(true);
      await toggleMarketActive(market._id);
      
      // Update local state
      setMarket(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      
      // Show success message (you can add a toast notification here)
    } catch (err) {
      console.error('Failed to toggle market status:', err);
      // You can add error handling here (e.g., toast notification)
    } finally {
      setToggleLoading(false);
    }
  }, [market]);

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
        // setVendors([]); // This line is removed as per the new_code
        // setVendorsLoading(false); // This line is removed as per the new_code
        
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

  if (error || !market) {
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
              <FaTimesCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
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

        {/* Market Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Market Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaStore className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
            
            {/* Market Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{market.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(calculateMarketStatus(market))}`}>
                    {getStatusLabel(calculateMarketStatus(market))}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    market.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {market.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6 break-words">{market.description}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 break-words">{market.location}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCalendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatDate(market.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaClock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatTime(market.startTime)} - {formatTime(market.endTime)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaUsers className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {market.registeredVendors.length} vendors registered
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaStore className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {market.boothsAvailable || 0} booths available
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaUserShield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      Vendor limit: {market.vendorLimit || 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Status Control */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Market Status Control</h2>
              <p className="text-sm text-gray-600">
                Control whether this market is visible and accessible to users
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-4">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  market.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {market.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={handleToggleActive}
                  disabled={toggleLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    market.isActive ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      market.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {toggleLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
        </div>

        {/* Market Categories */}
        {market.categories && market.categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Market Categories</h2>
            <div className="flex flex-wrap gap-2">
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
        )}

        {/* Registered Vendors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Registered Vendors</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <FaUsers className="h-5 w-5" />
              <span>{vendorsPagination.total} vendors</span>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search vendors by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {vendorsLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  {vendorsPagination.total > 0 
                    ? `Found ${vendorsPagination.total} vendor${vendorsPagination.total === 1 ? '' : 's'}`
                    : 'No vendors found'
                  }
                </p>
              )}
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <button
                onClick={() => handleSort('displayName')}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <span>Name</span>
                {sortBy === 'displayName' ? (
                  sortOrder === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />
                ) : (
                  <FaSort className="h-3 w-3 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <span>Date</span>
                {sortBy === 'createdAt' ? (
                  sortOrder === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />
                ) : (
                  <FaSort className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Vendor Statistics */}
          {vendors.length > 0 && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <FaUsers className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Vendors</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900">{vendorsPagination.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                <div className="flex items-center space-x-2">
                  <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-green-600 font-medium">Verified</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900">
                      {vendors.filter(v => v.isVerified).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <FaStar className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-yellow-600 font-medium">Avg Rating</p>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                      {(() => {
                        const ratedVendors = vendors.filter(v => v.rating);
                        if (ratedVendors.length === 0) return 'N/A';
                        const avg = ratedVendors.reduce((sum, v) => sum + (v.rating || 0), 0) / ratedVendors.length;
                        return avg.toFixed(1);
                      })()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                <div className="flex items-center space-x-2">
                  <FaMapMarkerAlt className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-purple-600 font-medium">Cities</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-900">
                      {new Set(vendors.filter(v => v.city).map(v => v.city)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Hint for Large Lists */}
          {vendorsPagination.total > 100 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-amber-800">
                <FaExclamationTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Large vendor list detected ({vendorsPagination.total} vendors). 
                  Use search and pagination for optimal performance.
                </span>
              </div>
            </div>
          )}

          {vendorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: Math.min(6, vendorsPagination.limit) }).map((_, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : vendorsError ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaExclamationTriangle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Error Loading Vendors</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {vendorsError}
              </p>
              <button
                onClick={fetchVendors}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm ? 'No Vendors Found' : 'No Vendors Registered Yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? `No vendors found matching "${searchTerm}". Try adjusting your search terms.`
                  : "This market doesn't have any registered vendors yet. Vendors can register through the market application process."
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor._id} vendor={vendor} />
              ))}
            </div>
          )}

          {vendorsPagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(vendorsPagination.page - 1)}
                  disabled={!vendorsPagination.hasPrev}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, vendorsPagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (vendorsPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (vendorsPagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (vendorsPagination.page >= vendorsPagination.totalPages - 2) {
                      pageNum = vendorsPagination.totalPages - 4 + i;
                    } else {
                      pageNum = vendorsPagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md transition-colors duration-200 ${
                          pageNum === vendorsPagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(vendorsPagination.page + 1)}
                  disabled={!vendorsPagination.hasNext}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 