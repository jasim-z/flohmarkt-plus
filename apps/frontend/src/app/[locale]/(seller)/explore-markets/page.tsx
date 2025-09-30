"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaSearch, FaCheck, FaDollarSign, FaSync } from "react-icons/fa";
import { getMarkets, Market } from "@/app/api/markets";
import UnAuthourized from "@/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";
import { formatPrice } from "@/lib/utils";

export default function SellerExploreMarkets() {
  const t = useTranslations();
  const router = useRouter();
  const { role, isLoaded, user } = useUser();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const lastMarketElementRef = useRef<HTMLDivElement>(null);

  // Early return after all hooks
  if (role !== 'seller' && isLoaded) return <UnAuthourized />;

  const fetchMarkets = useCallback(async (pageNum: number, isNewSearch: boolean = false) => {
    try {
      setLoading(true);
      
      const params: any = {
        page: pageNum,
        limit: 12,
        isActive: true,
        isDeleted: false,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      // Don't send status filter to backend since we calculate it dynamically
      // const response = await getMarkets(params);
      
      // For now, we'll fetch all markets and filter by status on the frontend
      // This ensures we get the most up-to-date status based on current time
      const response = await getMarkets(params);
      
      let filteredData = response.data;

      // Exclude markets the seller already joined
      if (user?.id) {
        filteredData = filteredData.filter(m => !(m.registeredVendors || []).includes(user.id));
      }
      
      // Apply status filter on the frontend using calculated status
      if (statusFilter) {
        filteredData = filteredData.filter(market => 
          calculateMarketStatus(market) === statusFilter
        );
      }
      
      if (isNewSearch) {
        setMarkets(filteredData);
      } else {
        setMarkets(prev => [...prev, ...filteredData]);
      }

      // Update pagination using backend hasNext to support filters/exclusions
      setHasMore(response.pagination.hasNext);
      setPage(isNewSearch ? 1 : pageNum);
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [searchTerm, statusFilter, user?.id]);

  useEffect(() => {
    if (isLoaded) {
      fetchMarkets(1, true);
    }
  }, [isLoaded, fetchMarkets]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMarkets(page + 1);
      }
    });

    if (lastMarketElementRef.current) {
      observer.current.observe(lastMarketElementRef.current);
    }
  }, [loading, hasMore, page, fetchMarkets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMarkets(1, true);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchMarkets(1, true);
  };

  // Calculate market status based on current date/time
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isSellerJoined = (market: Market) => {
    if (!user || !user.id || !market.registeredVendors) return false;
    return market.registeredVendors.includes(user.id);
  };

  const getVendorAvailability = (market: Market) => {
    const totalSlots = market.vendorLimit || 100; // Default to 100 if not specified
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Markets
          </h1>
          <p className="text-gray-600">Find and join flea markets in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search markets by name, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </select>
            
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Search
            </button>
          </form>
          
        </div>

        {/* Markets Grid */}
        {isInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
              <p className="text-gray-600">Loading markets...</p>
            </div>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <FaStore size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No markets found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market, index) => {
              const isJoined = isSellerJoined(market);
              const availability = getVendorAvailability(market);
              
              return (
                <div
                  key={market._id}
                  ref={index === markets.length - 1 ? lastMarketElementRef : null}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Market Image - Clickable for details */}
                  <div 
                    onClick={() => router.push(`/en/explore-markets/${market._id}`)}
                    className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  >
                    {market.bannerImage ? (
                      <img 
                        src={market.bannerImage} 
                        alt={market.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to SVG if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback SVG Icon */}
                    <div 
                      className={`flex items-center justify-center ${market.bannerImage ? 'hidden' : 'flex'}`}
                      style={{ display: market.bannerImage ? 'none' : 'flex' }}
                    >
                      <FaStore size={48} className="text-white" />
                    </div>
                    
                    {/* Join Status Badge */}
                    {isJoined && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <FaCheck size={10} />
                        <span>Joined</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Market Content */}
                  <div className="p-6">
                    {/* Market Name - Clickable for details */}
                    <div 
                      onClick={() => router.push(`/en/explore-markets/${market._id}`)}
                      className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {market.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(calculateMarketStatus(market))}`}>
                          {calculateMarketStatus(market)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {market.description}
                      </p>
                    </div>
                    
                    {/* Vendor Availability */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Vendor Slots</span>
                        <span className={`text-sm font-semibold ${getAvailabilityColor(availability.percentage)}`}>
                          {availability.available} out of {availability.total} available
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
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
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{availability.registered} registered</span>
                        <span>{availability.percentage}% full</span>
                      </div>
                    </div>
                    
                    {/* Market Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FaMapMarkerAlt size={14} />
                        <span>{market.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FaCalendar size={14} />
                        <span>{formatDate(market.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FaClock size={14} />
                        <span>{market.startTime} - {market.endTime}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FaDollarSign size={14} />
                        <span>{formatPrice(market.price)}</span>
                      </div>
                    </div>
                    
                    {/* Categories */}
                    {market.categories && market.categories.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {market.categories.slice(0, 3).map((category, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                          {market.categories.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{market.categories.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    {isJoined ? (
                      <button 
                        disabled
                        className="w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg font-medium cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <FaCheck size={14} />
                        <span>Already Joined</span>
                      </button>
                    ) : (
                      <button 
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                      >
                        Join Market
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading More Indicator */}
        {loading && hasMore && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-2 animate-spin"></div>
              <p className="text-gray-600 text-sm">Loading more markets...</p>
            </div>
          </div>
        )}

        {/* No More Markets */}
        {!hasMore && markets.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No more markets to load.</p>
          </div>
        )}
      </div>
    </div>
  );
} 