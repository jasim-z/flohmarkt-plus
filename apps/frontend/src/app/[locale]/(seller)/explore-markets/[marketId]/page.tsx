'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaArrowLeft, FaCheck, FaTimes, FaDollarSign, FaInfoCircle, FaBox, FaEdit, FaTrash, FaImage, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Market, getMarketDetails, joinMarket, leaveMarket } from "../../../../api/markets";
import { Listing, getListingsBySellerAndMarket, deleteListing, GetListingsParams } from "../../../../api/listings";
import { UnAuthourized } from "@/components";
import { useUser } from "@/contexts/UserContext";
import { formatPrice } from "@/lib/utils";
import { Toast, ToastType } from "@/components";
import { DataTable, Column } from "@/components/ui/data-table";

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

export default function MarketDetail() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { role, isLoaded, user } = useUser();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListingDetailsModal, setShowListingDetailsModal] = useState(false);
  const [showEditListingModal, setShowEditListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);
  
  // Additional images modal state
  const [showAdditionalImagesModal, setShowAdditionalImagesModal] = useState(false);
  
  // Photo viewer state
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [rawSearchInput, setRawSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Listing | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'desc' });

  // Debouncing ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Leave confirmation modal state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);


  // Fetch listings for the seller in this market
  const fetchListings = useCallback(async (params: GetListingsParams = {}) => {
    if (!market || !user?.id) return;
    
    try {
      setListingsLoading(true);
      const response = await getListingsBySellerAndMarket(user.id, market._id, params);
      console.log('Fetched listings response:', response);
      console.log('Listings data:', response.data);
      setListings(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setListingsLoading(false);
    }
  }, [market, user]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    const params: GetListingsParams = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: sortConfig.key as string || 'createdAt',
      sortOrder: sortConfig.direction || 'desc',
    };
    fetchListings(params);
  }, [fetchListings, searchTerm, sortConfig]);

  // Handle search
  const handleSearch = useCallback((term: string) => { setRawSearchInput(term); }, []);

  // Handle sort
  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key: key as keyof Listing, direction });
    const params: GetListingsParams = {
      page: 1,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: key,
      sortOrder: direction,
    };
    fetchListings(params);
  }, [fetchListings, searchTerm]);

  // Check if seller is already joined
  const checkJoinStatus = useCallback(() => {
    if (market && user) {
      const joined = market.registeredVendors?.includes(user.id || '');
      setIsJoined(!!joined);
      
      // If joined, fetch listings with current pagination
      if (joined && user.id) {
        const params: GetListingsParams = {
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          sortBy: sortConfig.key as string || 'createdAt',
          sortOrder: sortConfig.direction || 'desc',
        };
        fetchListings(params);
      }
    }
  }, [market, user, currentPage, searchTerm, sortConfig, fetchListings]);

  // Handle row click to show listing details
  const handleRowClick = useCallback((listing: Record<string, unknown>) => {
    setSelectedListing(listing as unknown as Listing);
    setShowListingDetailsModal(true);
  }, []);

  // Handle edit listing
  const handleEditListing = useCallback((listing: Record<string, unknown>) => {
    setEditingListing(listing as unknown as Listing);
    setShowEditListingModal(true);
  }, []);

  // Handle delete listing
  const handleDeleteListing = useCallback((listing: Record<string, unknown>) => {
    setDeletingListing(listing as unknown as Listing);
    setShowDeleteConfirmationModal(true);
  }, []);

  // Confirm delete listing
  const confirmDeleteListing = useCallback(async () => {
    if (!deletingListing) return;

    try {
      // Call the delete API
      await deleteListing(deletingListing._id);
      
      // Refresh listings with current pagination after deletion
      const params: GetListingsParams = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        sortBy: sortConfig.key as string || 'createdAt',
        sortOrder: sortConfig.direction || 'desc',
      };
      fetchListings(params);
      
      // Show success toast
      setToast({
        message: 'Listing deleted successfully!',
        type: 'success',
        isVisible: true,
      });
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting listing:', error);
      
      // Show error toast
      setToast({
        message: 'Failed to delete listing. Please try again.',
        type: 'error',
        isVisible: true,
      });
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setShowDeleteConfirmationModal(false);
      setDeletingListing(null);
    }
  }, [deletingListing]);

  // Photo viewer functions
  const openPhotoViewer = (photoIndex: number) => {
    if (!market) return;
    
    const photos = [];
    if (market.bannerImage) photos.push(market.bannerImage);
    if (market.additionalImages) photos.push(...market.additionalImages);
    
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

  useEffect(() => {
    checkJoinStatus();
  }, [checkJoinStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(rawSearchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [rawSearchInput]);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching market data for ID:', params.marketId);
      
      const response = await getMarketDetails(params.marketId as string);
      setMarket(response.market);
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [params.marketId]);

  useEffect(() => {
    if (params.marketId) {
      fetchMarketData();
    } else {
      console.error('No marketId in params:', params);
    }
  }, [params.marketId, fetchMarketData]);

  const handleJoinMarket = () => {
    if (!market || !user) return;
    setShowPaymentModal(true);
  };

  const handleLeaveMarket = async () => {
    if (!market || !user) return;
    
    try {
      setJoinLoading(true);
      
      // TODO: Implement leave market API call
      // const response = await leaveMarket(market._id);
      
      // For now, just simulate leaving
      setTimeout(() => {
        setIsJoined(false);
        setJoinLoading(false);
        // Clear listings when leaving market
        setListings([]);
        // You can add a success toast here
      }, 1000);
      
    } catch (err) {
      console.error('Failed to leave market:', err);
      setJoinLoading(false);
      // You can add error handling here
    }
  };

  // Authorization check after all hooks
  if (role !== 'seller' && isLoaded) {
    return <UnAuthourized />;
  }

  if (!isLoaded) {
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
              <FaTimes className="h-6 w-6 text-red-500 flex-shrink-0" />
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

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
    let end = start;
    if (endDate) {
      end = new Date(endDate).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    }
    return `${start} - ${end}`;
  };

  const getVendorAvailability = () => {
    const totalSlots = market.vendorLimit || 100;
    const registeredVendors = market.registeredVendors?.length || 0;
    const availableSlots = totalSlots - registeredVendors;
    
    return {
      total: totalSlots,
      registered: registeredVendors,
      available: availableSlots,
      percentage: Math.round((registeredVendors / totalSlots) * 100)
    };
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Define columns for the listings data table
  const listingColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'title',
      label: 'Item Title',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            {row.images && Array.isArray(row.images) && row.images.length > 0 ? (
              <img 
                src={row.images[0] as string} 
                alt={String(value || '')}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <FaBox className={`h-5 w-5 text-white ${row.images && Array.isArray(row.images) && row.images.length > 0 ? 'hidden' : 'block'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {String(value || '')}
            </span>
            <span className="text-xs text-gray-500">{String(row.description || '').substring(0, 50)}...</span>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          {row.isFree ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Free</span>
          ) : (
            <span className="text-sm font-semibold text-gray-900">
              €{Number(value || 0).toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: unknown) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'condition',
      label: 'Condition',
      sortable: true,
      render: (value: unknown) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
          {String(value || '')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => {
        const status = String(value || '');
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'sold': return 'bg-blue-100 text-blue-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
          }
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditListing(row);
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Listing"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteListing(row);
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete Listing"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const availability = getVendorAvailability();

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
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(calculateMarketStatus(market))}`}>
                    {getStatusLabel(calculateMarketStatus(market))}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    market.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {market.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* Join/Leave Button - Moved to title row */}
                <div className="flex-shrink-0 ml-auto">
                  {isJoined ? (
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center space-x-1">
                        <FaCheck size={12} />
                        <span>Joined</span>
                      </span>
                      <button
                        onClick={() => setShowLeaveConfirm(true)}
                        disabled={joinLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                      >
                        {joinLoading ? 'Leaving...' : 'Leave Market'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinMarket}
                      disabled={joinLoading || availability.available === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                      {joinLoading ? 'Joining...' : availability.available === 0 ? 'Market Full' : 'Join Market'}
                    </button>
                  )}
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
                    <span className="text-gray-700">{formatDateRange(market.date, market.endDate)}</span>
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
                    <FaDollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      Booth price: {formatPrice(market.price)}
                    </span>
                  </div>
                </div>
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

        {/* Conditional Content based on join status */}
        {!isJoined ? (
          /* Vendor Availability Section - Only show when not joined */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Vendor Availability</h2>
              <p className="text-sm text-gray-600 mb-4">
                Current availability and pricing for vendor booths
              </p>
              
              {/* Availability Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">{availability.available}</div>
                  <div className="text-sm text-gray-600">Available Slots</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">{availability.registered}</div>
                  <div className="text-sm text-gray-600">Registered Vendors</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">{availability.total}</div>
                  <div className="text-sm text-gray-600">Total Capacity</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Market Capacity</span>
                  <span className={`text-sm font-semibold ${getAvailabilityColor(availability.percentage)}`}>
                    {availability.percentage}% full
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      availability.percentage >= 90 ? 'bg-red-500' :
                      availability.percentage >= 75 ? 'bg-orange-500' :
                      availability.percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${availability.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Listings Section - Only show when joined */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Listings</h2>
                <p className="text-sm text-gray-600">
                  Manage your items listed in this market
                </p>
              </div>
              <button
                onClick={() => setShowAddListingModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
              >
                <FaBox className="h-4 w-4" />
                <span>Add Listing</span>
              </button>
            </div>
            
            {listingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
                  <p className="text-gray-600">Loading your listings...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Search Status */}
                {searchLoading && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="loader border-2 border-blue-600 border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                      <span className="text-sm text-blue-700">Searching...</span>
                    </div>
                  </div>
                )}
                
              <DataTable
                data={listings as unknown as Record<string, unknown>[]}
                columns={listingColumns}
                pageSize={10}
                searchable={true}
                className="mb-4"
                emptyStateMessage={searchTerm ? 'No Search Results' : 'No Items Listed'}
                emptyStateDescription={
                  searchTerm 
                    ? `No listings found matching "${searchTerm}". Try adjusting your search terms.`
                    : "You haven't listed any items in this market yet. Start selling by adding your first listing!"
                }
                onRowClick={handleRowClick}
                // Server-side pagination props
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
                onSort={handleSort}
                sortConfig={sortConfig}
                loading={listingsLoading || searchLoading}
                searchValue={rawSearchInput}
              />
              
              {/* Add Your First Listing button - only show when no listings and no search term */}
              {listings.length === 0 && !searchTerm && !listingsLoading && !searchLoading && (
                <div className="text-center py-6">
                  <button
                    onClick={() => setShowAddListingModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2 mx-auto"
                  >
                    <FaBox className="h-4 w-4" />
                    <span>Add Your First Listing</span>
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}

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

        {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
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

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Leave this market?</h2>
            <p className="mb-4 text-gray-700">Are you sure you want to leave this market?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLeaveConfirm(false);
                  setJoinLoading(true);
                  try {
                    const res = await leaveMarket(market._id);
                    setIsJoined(false);
                    setToast({ message: res.message, type: 'success', isVisible: true });
                    setListings([]);
                  } catch (e: any) {
                    const isForbidden = e?.status === 403;
                    const isListingBlock =
                      isForbidden ||
                      (typeof e?.message === 'string' &&
                        e.message.toLowerCase().includes('delete them first'));
                    setToast({
                      message: isListingBlock
                        ? 'You have listings in this market, please delete them first or contact admin.'
                        : e.message || 'Something went wrong. Please try again.',
                      type: 'error',
                      isVisible: true,
                    });
                  } finally {
                    setJoinLoading(false);
                  }
                }}
                className="px-4 py-2 rounded bg-red-600 text-white"
                disabled={joinLoading}
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}