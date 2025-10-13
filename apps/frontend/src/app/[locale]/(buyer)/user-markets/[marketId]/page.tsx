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
  FaTimes,
  FaBox,
  FaEye,
  FaImage,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { getMarketDetails, Market, Vendor } from '@/app/api/markets';
import { getListingsByMarket, Listing } from '@/app/api/listings';

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
  const [exploreMode, setExploreMode] = useState<'vendors' | 'items'>('vendors');
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsPagination, setListingsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [loadingMoreListings, setLoadingMoreListings] = useState(false);
  const [hasMoreVendors, setHasMoreVendors] = useState(true);
  const [loadingMoreVendors, setLoadingMoreVendors] = useState(false);

  // Additional images modal state
  const [showAdditionalImagesModal, setShowAdditionalImagesModal] = useState(false);

  // Photo viewer state
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);

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

  // Fetch listings when explore mode changes to items
  useEffect(() => {
    if (exploreMode === 'items' && params.marketId) {
      fetchListings();
    }
  }, [exploreMode, params.marketId]);

  // Always fetch listings count for statistics (lightweight request)
  useEffect(() => {
    if (!params.marketId) return;
    (async () => {
      try {
        const response = await getListingsByMarket(params.marketId as string, { page: 1, limit: 1 });
        setListingsPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        }));
      } catch (err) {
        console.error('Error fetching listings count:', err);
      }
    })();
  }, [params.marketId]);



  const fetchMarketDetails = async () => {
    try {
      setLoading(true);
      const response = await getMarketDetails(params.marketId as string);
      setMarketDetails(response);
      // Set hasMoreVendors based on pagination response
      setHasMoreVendors(response.pagination.hasNext);
    } catch (err) {
      console.error('Error fetching market details:', err);
      setError('Failed to load market details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async (append: boolean = false) => {
    if (!params.marketId) return;
    
    try {
      if (append) {
        setLoadingMoreListings(true);
      } else {
        setListingsLoading(true);
      }
      
      const response = await getListingsByMarket(params.marketId as string, {
        page: append ? listingsPagination.page + 1 : 1,
        limit: listingsPagination.limit,
        search: searchTerm || undefined,
      });
      
      if (append) {
        setListings(prev => [...prev, ...response.data]);
        setListingsPagination(prev => ({
          ...prev,
          page: prev.page + 1,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }));
      } else {
        setListings(response.data);
        setListingsPagination(response.pagination);
      }
      
      setHasMoreListings(response.pagination.page < response.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      if (append) {
        setLoadingMoreListings(false);
      } else {
        setListingsLoading(false);
      }
    }
  };

  const loadMoreVendors = async () => {
    if (!marketDetails || loadingMoreVendors || !hasMoreVendors) return;
    
    try {
      setLoadingMoreVendors(true);
      const currentVendorPage = Math.ceil(marketDetails.vendors.length / 20) + 1;
      
      const response = await getMarketDetails(params.marketId as string, {
        page: currentVendorPage,
        limit: 20,
        search: searchTerm || undefined,
      });
      
      if (response.vendors && response.vendors.length > 0) {
        setMarketDetails(prev => ({
          ...prev!,
          vendors: [...prev!.vendors, ...response.vendors],
          pagination: response.pagination
        }));
      }
      // Always update hasMoreVendors based on pagination response
      setHasMoreVendors(response.pagination.hasNext);
    } catch (err) {
      console.error('Error loading more vendors:', err);
    } finally {
      setLoadingMoreVendors(false);
    }
  };

  // Photo viewer functions
  const openPhotoViewer = (photoIndex: number) => {
    if (!marketDetails?.market) return;
    
    const photos = [];
    if (marketDetails.market.bannerImage) photos.push(marketDetails.market.bannerImage);
    if (marketDetails.market.additionalImages) photos.push(...marketDetails.market.additionalImages);
    
    setAllPhotos(photos);
    setCurrentPhotoIndex(photoIndex);
    setShowPhotoViewer(true);
  };

  const closePhotoViewer = () => {
    setShowPhotoViewer(false);
    setCurrentPhotoIndex(0);
    setAllPhotos([]);
  };

  const goToPreviousPhoto = () => {
    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : allPhotos.length - 1);
  };

  const goToNextPhoto = () => {
    setCurrentPhotoIndex(prev => prev < allPhotos.length - 1 ? prev + 1 : 0);
  };

  // Infinite scroll handlers
  useEffect(() => {
    const handleScroll = () => {
      if (exploreMode === 'items' && hasMoreListings && !loadingMoreListings) {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollTop + windowHeight >= documentHeight - 100) {
          fetchListings(true);
        }
      } else if (exploreMode === 'vendors' && hasMoreVendors && !loadingMoreVendors) {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollTop + windowHeight >= documentHeight - 100) {
          loadMoreVendors();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [exploreMode, hasMoreListings, loadingMoreListings, hasMoreVendors, loadingMoreVendors, fetchListings, loadMoreVendors]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const end = endDate || startDate;
    return `${formatDate(startDate)} - ${formatDate(end)}`;
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

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={() => openPhotoViewer(0)}
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
              </div>
              
              <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6 break-words">{market.description}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                  <FaCalendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      {formatDateRange(market.date, (market as any).endDate)}
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
          
          {/* Additional Images Button */}
          {market.additionalImages && market.additionalImages.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAdditionalImagesModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <FaImage className="h-4 w-4" />
                <span className="text-sm font-medium">
                  View Additional Images ({market.additionalImages.length})
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Market Statistics Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Market Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{marketDetails.statistics.totalVendors}</div>
              <div className="text-sm text-gray-600">Total Vendors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{marketDetails.statistics.verifiedVendors}</div>
              <div className="text-sm text-gray-600">Verified Vendors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{marketDetails.statistics.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Vendor Ratings</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{listingsPagination.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>
        </div>

        {/* Explore Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Section Header with Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {exploreMode === 'vendors' ? 'Explore Vendors' : 'Explore Items'}
              </h2>
              <p className="text-sm text-gray-600">
                {exploreMode === 'vendors' 
                  ? 'Discover unique vendors and their offerings at this flea market'
                  : 'Browse all items available at this flea market'
                }
              </p>
            </div>
            
            {/* Explore Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setExploreMode('vendors')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  exploreMode === 'vendors'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FaUsers className="w-4 h-4" />
                  <span>Vendors</span>
                </div>
              </button>
              <button
                onClick={() => setExploreMode('items')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  exploreMode === 'items'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FaBox className="w-4 h-4" />
                  <span>Items</span>
                </div>
              </button>
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
                  placeholder={exploreMode === 'vendors' ? 'Search vendors...' : 'Search items...'}
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

          {/* Conditional Content: Vendors or Items */}
          {exploreMode === 'vendors' ? (
            /* Vendors Display */
            filteredVendors.length === 0 ? (
              <div className="text-center py-12">
                <FaStore className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    onClick={() => {
                      router.push(`/${params.locale}/user-markets/${params.marketId}/seller/${vendor._id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/${params.locale}/user-markets/${params.marketId}/seller/${vendor._id}`);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View all items from ${vendor.displayName}`}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                      
                      {/* Click hint */}
                      <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                        Click to view all items from this seller
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Infinite Scroll Loading Indicator for Vendors */}
              {loadingMoreVendors && (
                <div className="mt-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
                    <p className="text-gray-600">Loading more vendors...</p>
                  </div>
                </div>
              )}
              
              {/* End of Results for Vendors */}
              {!hasMoreVendors && filteredVendors.length > 0 && (
                <div className="mt-8 text-center">
                  <p className="text-gray-500 text-sm">You&apos;ve reached the end of all vendors</p>
                </div>
              )}
              </>
            )
          ) : (
            /* Items Display */
            listingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
                  <p className="text-gray-600">Loading items...</p>
                </div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    onClick={() => {
                      // Find the seller for this listing
                      const seller = marketDetails?.vendors.find(v => v._id === listing.sellerId);
                      if (seller) {
                        const vendorData = encodeURIComponent(JSON.stringify(seller));
                        router.push(`/${params.locale}/user-markets/${params.marketId}/seller/${listing.sellerId}/item/${listing._id}?vendor=${vendorData}`);
                      }
                    }}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer ${
                      viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                    }`}
                  >
                    {/* Item Image */}
                    <div className={`${viewMode === 'list' ? 'mr-4' : 'mb-4'}`}>
                      <div className={`bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center ${
                        viewMode === 'list' ? 'w-16 h-16' : 'w-20 h-20'
                      }`}>
                        {listing.images && listing.images.length > 0 ? (
                          <img 
                            src={listing.images[0]} 
                            alt={listing.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FaBox className={`text-green-600 ${viewMode === 'list' ? 'w-6 h-6' : 'w-8 h-8'}`} />
                        )}
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {listing.title}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          {listing.category}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>

                      {/* Price & Condition */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {listing.isFree ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Free</span>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              €{listing.price.toFixed(2)}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                            {listing.condition}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200">
                          Message Seller
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Infinite Scroll Loading Indicator for Items */}
                {loadingMoreListings && (
                  <div className="mt-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
                      <p className="text-gray-600">Loading more items...</p>
                    </div>
                  </div>
                )}
                
                {/* End of Results for Items */}
                {!hasMoreListings && filteredListings.length > 0 && (
                  <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">You&apos;ve reached the end of all items</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Additional Images Modal */}
      {showAdditionalImagesModal && market.additionalImages && market.additionalImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {market.name} - Additional Images
                </h3>
                <p className="text-sm text-gray-500">
                  {market.additionalImages.length} additional images for this market
                </p>
              </div>
              <button
                onClick={() => setShowAdditionalImagesModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {market.additionalImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Additional image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                      onClick={() => openPhotoViewer(index + (market.bannerImage ? 1 : 0))}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAdditionalImagesModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Photo Viewer */}
      {showPhotoViewer && allPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60]">
          {/* Close Button */}
          <button
            onClick={closePhotoViewer}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
          >
            <FaTimes className="h-6 w-6" />
          </button>

          {/* Navigation Arrows */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={goToPreviousPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              >
                <FaChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              >
                <FaChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="flex items-center justify-center w-full h-full p-4">
            <img
              src={allPhotos[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          </div>

          {/* Photo Counter */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {currentPhotoIndex + 1} / {allPhotos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 