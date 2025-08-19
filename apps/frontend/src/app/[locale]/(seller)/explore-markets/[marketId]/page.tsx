'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaArrowLeft, FaCheck, FaTimes, FaDollarSign, FaInfoCircle, FaBox, FaEdit, FaTrash } from "react-icons/fa";
import { Market, getMarketDetails, joinMarket } from "../../../../api/markets";
import { Listing, getListingsBySellerAndMarket } from "../../../../api/listings";
import UnAuthourized from "@/app/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";
import { formatPrice } from "@/lib/utils";
import PaymentModal from "@/app/components/PaymentModal";
import Toast, { ToastType } from "@/app/components/Toast";
import { DataTable, Column } from "@/components/ui/data-table";
import AddListingModal from "@/app/components/AddListingModal";

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
  const [showAddListingModal, setShowAddListingModal] = useState(false);

  // Early return after all hooks
  if (role !== 'seller' && isLoaded) return <UnAuthourized />;

  // Check if seller is already joined
  const checkJoinStatus = useCallback(() => {
    if (market && user) {
      const joined = market.registeredVendors?.includes(user._id || '');
      setIsJoined(!!joined);
      
      // If joined, fetch listings
      if (joined && user._id) {
        fetchListings();
      }
    }
  }, [market, user]);

  // Fetch listings for the seller in this market
  const fetchListings = useCallback(async () => {
    if (!market || !user?._id) return;
    
    try {
      setListingsLoading(true);
      const sellerListings = await getListingsBySellerAndMarket(user._id, market._id);
      setListings(sellerListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setListingsLoading(false);
    }
  }, [market, user]);

  useEffect(() => {
    checkJoinStatus();
  }, [checkJoinStatus]);

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

  const handlePaymentSuccess = async () => {
    if (!market || !user) return;
    
    try {
      setJoinLoading(true);
      
      // The actual join market API call is handled in the PaymentModal
      // This function is called after successful payment and API call
      
      // Refetch market data to get updated registeredVendors list
      await fetchMarketData();
      
      // Update local state
      setIsJoined(true);
      setJoinLoading(false);
      
      setToast({
        message: `Successfully joined ${market.name}!`,
        type: 'success',
        isVisible: true
      });
      
      // Fetch listings after joining
      setTimeout(() => {
        fetchListings();
      }, 1000); // Small delay to ensure market data is updated
      
    } catch (err) {
      console.error('Failed to join market:', err);
      setJoinLoading(false);
      setToast({
        message: 'Failed to join market. Please try again.',
        type: 'error',
        isVisible: true
      });
    }
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
              ${Number(value || 0).toFixed(2)}
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
              // TODO: Implement edit listing
              console.log('Edit listing:', row._id);
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Listing"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement delete listing
              console.log('Delete listing:', row._id);
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
                        onClick={handleLeaveMarket}
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
                    <FaDollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      Booth price: {formatPrice(market.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            ) : listings.length > 0 ? (
              <DataTable
                data={listings as unknown as Record<string, unknown>[]}
                columns={listingColumns}
                pageSize={10}
                searchable={true}
                className="mb-4"
                emptyStateMessage="No listings found"
                emptyStateDescription="Try adjusting your search terms."
              />
            ) : (
              <div className="text-center py-12">
                <FaBox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Listed</h3>
                <p className="text-gray-600 mb-6">
                  You haven't listed any items in this market yet. Start selling by adding your first listing!
                </p>
                <button
                  onClick={() => setShowAddListingModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2 mx-auto"
                >
                  <FaBox className="h-4 w-4" />
                  <span>Add Your First Listing</span>
                </button>
              </div>
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

        {/* Market Rules & Information - Only show when not joined */}
        {!isJoined && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Market Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What to Expect</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start space-x-2">
                    <FaCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Professional market environment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FaCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Organized vendor spaces</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FaCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Customer traffic and exposure</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FaCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Marketing and promotion support</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start space-x-2">
                    <FaInfoCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Valid business license (if required)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FaInfoCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Professional presentation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FaInfoCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Quality products and services</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FaInfoCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Timely setup and teardown</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        marketName={market?.name || ''}
        price={market?.price || '0'}
        marketId={market?._id || ''}
      />

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={showAddListingModal}
        onClose={() => setShowAddListingModal(false)}
        onSuccess={(message) => {
          // Refresh listings after successful creation
          fetchListings();
          
          // Show success toast if message provided
          if (message) {
            setToast({
              message,
              type: 'success',
              isVisible: true,
            });
            
            // Auto-hide toast after 3 seconds
            setTimeout(() => {
              setToast(null);
            }, 3000);
          }
        }}
        marketId={market?._id || ''}
        marketName={market?.name || ''}
        marketLocation={market?.location || ''}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 