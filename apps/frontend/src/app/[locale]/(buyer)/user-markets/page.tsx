'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaSearch, 
  FaSort,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaStore,
  FaMapMarkerAlt,
  FaLocationArrow
} from 'react-icons/fa';
import { getMarkets, getFeaturedMarkets, Market } from '@/app/api/markets';
import { MarketCard } from '@/components/business';
import { ProfilePhotoUpload } from '@/components';
import { LocationResult, searchMarketsByLocation, searchLocations, updateUserLocation, reverseGeocode } from '@/app/api/location';

interface FilterState {
  search: string;
  category: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const CATEGORIES = [
  'All Markets',
  'Flea Markets',
  'Farmers Markets',
  'Craft Fairs',
  'Antique Markets',
  'Food Markets',
  'Art Markets',
  'Vintage Markets'
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'vendorLimit', label: 'Vendor Count' },
  { value: 'startTime', label: 'Start Time' },
  { value: 'distance', label: 'Distance' }
];


export default function BuyerMarkets() {
  const { user, isLoaded, isLoading: authLoading, setUserData } = useUser();
  const router = useRouter();
  const params = useParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationResult[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSearchValue, setLocationSearchValue] = useState('');
  const [locationMarkets, setLocationMarkets] = useState<Market[]>([]);
  const [locationHasMore, setLocationHasMore] = useState(true);
  const [locationCurrentPage, setLocationCurrentPage] = useState(1);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All Markets',
    status: 'all',
    sortBy: 'date',
    sortOrder: 'asc'
  });
  
  // Ref for the sentinel element (trigger for infinite scroll)
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Location change handler
  const handleLocationChange = async (location: LocationResult | null) => {
    setSelectedLocation(location);
    setLocationSearchValue('');
    setShowLocationSuggestions(false);
    setShowLocationInput(false); // Hide input after selection
    setCurrentPage(1);
    setHasMore(true);
    setLocationCurrentPage(1);
    setLocationHasMore(true);
    setLocationMarkets([]);
    
    if (location) {
      setLocationLoading(true);
      try {
        // Save user's location preference
        const response = await updateUserLocation({
          address: location.address,
          city: location.displayName.split(',')[0]?.trim() || '',
          latitude: location.lat,
          longitude: location.lon,
        });
        
        // Update user context with new location data
        if (response.user) {
          setUserData(response.user);
        }
        
        // Fetch first page of markets by location
        await loadLocationMarkets(location, 1, false);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching markets by location:', err);
        setError('Failed to fetch markets for selected location');
        setLocationMarkets([]);
      } finally {
        setLocationLoading(false);
      }
    } else {
      // No location selected, fetch all markets
      // Force bypass of selectedLocation guard inside fetchMarkets
      setShowLocationInput(true); // Show input when clearing location
      fetchMarkets(1, false, true);
    }
  };

  // Handle location search
  const handleLocationSearch = async (query: string) => {
    setLocationSearchValue(query);
    
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    
    try {
      const response = await searchLocations({ query, limit: 5 });
      setLocationSuggestions(response.results);
      setShowLocationSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  // Load location-based markets with pagination
  const loadLocationMarkets = async (location: LocationResult, page: number, append: boolean = false) => {
    try {
      const response = await searchMarketsByLocation({
        latitude: location.lat,
        longitude: location.lon,
        radiusKm: 50,
        page,
        limit: 10
      });
      
      // Convert the response to Market format and add distance
      const marketsWithDistance = response.markets.map(market => ({
        ...market,
        distance: market.distance,
      }));
      
      if (append) {
        setLocationMarkets(prev => [...prev, ...marketsWithDistance]);
      } else {
        setLocationMarkets(marketsWithDistance);
      }
      
      // Update total count from backend pagination
      setTotalMarkets(response.pagination.total || marketsWithDistance.length);

      setLocationHasMore(response.pagination.hasNext);
      setLocationCurrentPage(page);
      
    } catch (err: any) {
      console.error('Error loading location markets:', err);
      throw err;
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const response = await reverseGeocode({
        lat: position.coords.latitude,
        lon: position.coords.longitude
      });

            if (response.result) {
              // Save current location to user profile
              const locationResponse = await updateUserLocation({
                address: response.result.address,
                city: response.result.displayName.split(',')[0]?.trim() || '',
                latitude: response.result.lat,
                longitude: response.result.lon,
              });
              
              // Update user context with new location data
              if (locationResponse.user) {
                setUserData(locationResponse.user);
              }
              
              await handleLocationChange(response.result);
            } else {
              setError('Could not determine your current location');
            }
    } catch (error: any) {
      console.error('Error getting current location:', error);
      if (error.code === 1) {
        setError('Location access denied. Please allow location access to use this feature.');
      } else if (error.code === 2) {
        setError('Location unavailable. Please check your internet connection.');
      } else if (error.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Could not get your current location. Please try again.');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  // Load user's saved location on mount
  useEffect(() => {
    if (user && user.latitude && user.longitude) {
      const savedLocation: LocationResult = {
        displayName: user.address || '',
        address: user.address || '',
        lat: user.latitude,
        lon: user.longitude,
        placeId: '',
        type: '',
        importance: 0,
      };
      
      // Set the location and hide the input (show compact view)
      setSelectedLocation(savedLocation);
      setLocationSearchValue(savedLocation.address);
      setShowLocationInput(false); // Start with compact view
      
      // Clear regular markets and load location markets
      setMarkets([]);
      setLocationMarkets([]);
      setLocationCurrentPage(1);
      setLocationHasMore(true);
      
      // Automatically load markets for the saved location
      loadLocationMarkets(savedLocation, 1, false).catch(err => {
        console.error('Error loading saved location markets:', err);
      });
    } else if (user && !user.latitude && !user.longitude) {
      // No saved location, load regular markets and show input
      setShowLocationInput(true);
      fetchMarkets(1, false);
    }
  }, [user]);

  // Close location suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.location-search-container')) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user && user.role === 'buyer') {
        fetchMarkets();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [filters, user]);

  // Fetch markets on initial load
  useEffect(() => {
    if (user && user.role === 'buyer') {
      fetchMarkets();
      fetchFeaturedMarkets();
    }
  }, [user]); // Remove filters dependency since we handle it separately above

  const fetchMarkets = async (page: number = 1, append: boolean = false, force: boolean = false) => {
    try {
      console.log(`Fetching markets: page=${page}, append=${append}`);
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // If location is selected, don't use regular fetchMarkets unless forced
      if (selectedLocation && !force) {
        console.log('Location selected, skipping regular fetchMarkets');
        return;
      }
      
      // Prepare API parameters
      const apiParams = {
        page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        category: filters.category === 'All Markets' ? undefined : filters.category
      };

      // Remove undefined parameters
      const cleanParams = Object.fromEntries(
        Object.entries(apiParams).filter(([_, value]) => value !== undefined)
      );
      
      console.log('API params:', cleanParams);
      const response = await getMarkets(cleanParams);
      console.log('API response:', response);
      
      if (append) {
        setMarkets(prev => {
          const newMarkets = [...prev, ...(response.data || [])];
          console.log(`Appending markets: prev=${prev.length}, new=${response.data?.length}, total=${newMarkets.length}`);
          return newMarkets;
        });
      } else {
        setMarkets(response.data || []);
        console.log(`Setting markets: ${response.data?.length} markets`);
      }
      
      // Update total count from backend pagination
      if (response?.pagination?.total !== undefined) {
        setTotalMarkets(response.pagination.total);
      } else {
        setTotalMarkets((response.data || []).length);
      }

      // Check if there are more pages
      const hasMorePages = response.pagination && response.pagination.page < response.pagination.totalPages;
      console.log(`Pagination: page=${response.pagination?.page}, totalPages=${response.pagination?.totalPages}, hasMore=${hasMorePages}`);
      
      setHasMore(hasMorePages);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchFeaturedMarkets = async () => {
    try {
      const response = await getFeaturedMarkets(4);
      setFeaturedMarkets((response.data || []).slice(0, 4));
    } catch (err) {
      console.error('Error fetching featured markets:', err);
    }
  };

  const loadMoreMarkets = useCallback(async () => {
    if (selectedLocation) {
      // Load more location-based markets
      if (!loadingMore && locationHasMore) {
        setLoadingMore(true);
        try {
          await loadLocationMarkets(selectedLocation, locationCurrentPage + 1, true);
        } catch (err) {
          console.error('Error loading more location markets:', err);
        } finally {
          setLoadingMore(false);
        }
      }
    } else {
      // Load more regular markets
      if (!loadingMore && hasMore) {
        fetchMarkets(currentPage + 1, true);
      }
    }
  }, [loadingMore, hasMore, currentPage, selectedLocation, locationHasMore, locationCurrentPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    // Only set up observer if we have more markets to load
    const hasMoreToLoad = selectedLocation ? locationHasMore : hasMore;
    if (!hasMoreToLoad || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        console.log('Intersection observer triggered:', {
          isIntersecting: target.isIntersecting,
          hasMore,
          loadingMore,
          currentPage
        });
        
        if (target.isIntersecting && hasMore && !loadingMore) {
          console.log('Loading more markets...');
          loadMoreMarkets();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before reaching the bottom
        threshold: 0.1
      }
    );

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (sentinelRef.current) {
        observer.observe(sentinelRef.current);
        console.log('Observer attached to sentinel element');
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
        console.log('Observer detached from sentinel element');
      }
    };
  }, [loadMoreMarkets, hasMore, loadingMore, currentPage, markets.length, selectedLocation, locationHasMore, locationMarkets.length]);

  // Filter markets based on search and location
  const filteredMarkets = useMemo(() => {
    const marketsToFilter = selectedLocation ? locationMarkets : markets;
    
    if (!selectedLocation) {
      // No location selected, use markets as-is (backend filtering)
      return marketsToFilter;
    }
    
    // Location selected, apply frontend filtering to location-based results
    let filtered = marketsToFilter;
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(market => 
        market.name.toLowerCase().includes(searchLower) ||
        market.description.toLowerCase().includes(searchLower) ||
        market.location.toLowerCase().includes(searchLower) ||
        market.categories.some(cat => cat.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (filters.category !== 'All Markets') {
      filtered = filtered.filter(market => 
        market.categories.includes(filters.category)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(market => market.status === filters.status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'vendorLimit':
          comparison = (a.vendorLimit || 0) - (b.vendorLimit || 0);
          break;
        case 'startTime':
          comparison = a.startTime.localeCompare(b.startTime);
          break;
        case 'distance':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [markets, locationMarkets, filters, selectedLocation]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset pagination when filters change
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
    // Reset pagination when sorting changes
    setCurrentPage(1);
    setHasMore(true);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'All Markets',
      status: 'all',
      sortBy: 'date',
      sortOrder: 'asc'
    });
    // Reset pagination when clearing filters
    setCurrentPage(1);
    setHasMore(true);
  };

  const hasActiveFilters = filters.search || filters.category !== 'All Markets' || filters.status !== 'all';

  const handleMarketClick = (marketId: string) => {
    router.push(`/${params.locale}/user-markets/${marketId}`);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${selectedLocation && !showLocationInput ? 'py-6' : 'py-16 md:py-24'}`}>
          
          {/* Full Hero - No Location Selected */}
          {(!selectedLocation || showLocationInput) && (
            <>
              <div className="text-center mb-10 md:mb-16">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-lg">
                  Discover Local Markets
                </h1>
                <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto leading-relaxed">
                  Find the best flea markets, craft fairs, and local events near you
                </p>
              </div>
              
              {/* Location Search */}
              <div className="max-w-2xl mx-auto mb-8 location-search-container">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {selectedLocation ? 'Your Location' : 'Choose Your Location'}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {selectedLocation 
                        ? `Markets near ${selectedLocation.address}` 
                        : 'Search for your location or use current location'
                      }
                    </p>
                  </div>
                  
                  <div className="relative group">
                    <FaMapMarkerAlt className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      placeholder={selectedLocation ? "Change location..." : "Search for your location..."}
                      value={locationSearchValue}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      className="w-full pl-14 pr-20 py-4 text-gray-900 rounded-2xl border-0 shadow-lg focus:ring-4 focus:ring-blue-300/50 focus:outline-none text-lg bg-white/95 backdrop-blur-sm transition-all duration-300 hover:bg-white"
                    />
                    
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      {selectedLocation && (
                        <button
                          onClick={() => handleLocationChange(null)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                          title="Clear location"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={handleGetCurrentLocation}
                        disabled={locationLoading}
                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50 disabled:opacity-50"
                        title="Use current location"
                      >
                        <FaLocationArrow className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Location Suggestions */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-60 overflow-y-auto">
                      {locationSuggestions.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationChange(location)}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{location.displayName}</div>
                          <div className="text-sm text-gray-500">{location.address}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Compact Hero - Location Selected */}
          {selectedLocation && !showLocationInput && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl md:text-3xl font-bold">Markets Near You</h2>
                  <button
                    onClick={() => setShowLocationInput(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-white/30 transition-all duration-200 hover:scale-105"
                  >
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span className="font-medium">{selectedLocation.address}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={locationLoading}
                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-white/30 transition-colors disabled:opacity-50"
                    title="Use current location"
                  >
                    <FaLocationArrow className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleLocationChange(null)}
                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-white/30 transition-colors"
                    title="Clear location"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Market Search & Filters Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Market Count & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <FaStore className="w-5 h-5 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">
                {selectedLocation ? `Markets near ${selectedLocation.address}` : 'All Markets'}
              </span>
              <span className="text-lg text-gray-500">
                ({totalMarkets} {totalMarkets === 1 ? 'market' : 'markets'})
              </span>
            </div>
            
            {/* Market Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search markets, categories, vendors..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <button
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FaSort className="w-3 h-3" />
                <span>{filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
              </button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <FaTimes className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mt-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <span className="flex items-center text-gray-700 font-medium">
                <FaFilter className="w-4 h-4 mr-2 text-blue-600" />
                Filters & Sorting
              </span>
              <FaChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showMobileFilters && (
        <div className="lg:hidden bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white hover:border-gray-400 transition-colors"
              >
                <option value="all">All Markets</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Live Now</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
              <div className="flex space-x-3">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white hover:border-gray-400 transition-colors"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSortChange(filters.sortBy)}
                  className={`px-4 py-3 rounded-lg border text-sm transition-all duration-200 hover:scale-105 ${
                    filters.sortOrder === 'asc' 
                      ? 'border-primary-500 text-primary-600 bg-primary-50 shadow-sm' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  title={filters.sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Featured Markets Section - Only show when no filters are applied */}
      {featuredMarkets.length > 0 && !hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Markets</h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Curated</span>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredMarkets.map((market) => (
              <MarketCard
                key={market._id}
                market={market}
                variant="featured"
                onClick={() => handleMarketClick(market._id)}
              />
            ))}
            </div>
          </div>
        </div>
      )}

      {/* All Markets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {featuredMarkets.length > 0 && !hasActiveFilters && (
          <hr className="border-t border-gray-200 mb-6" />
        )}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">All Markets</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="h-32 bg-gray-200 rounded-lg mb-4 skeleton"></div>
                <div className="h-5 bg-gray-200 rounded mb-2 skeleton"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4 skeleton"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2 skeleton"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg font-semibold mb-2">{error}</div>
            <button
              onClick={() => fetchMarkets(1, false)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg font-semibold mb-2">
              No markets found
            </div>
            <p className="text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market._id}
                  market={market}
                  variant="compact"
                  onClick={() => handleMarketClick(market._id)}
                />
              ))}
            </div>
            
            {/* Infinite Scroll Sentinel */}
            {((selectedLocation && locationHasMore) || (!selectedLocation && hasMore)) && (
              <div ref={sentinelRef} className="py-8 min-h-[100px]">
                {loadingMore ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <span className="text-gray-600">Loading more markets...</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-3">
                      Scroll down to load more markets
                    </div>
                    <button
                      onClick={() => loadMoreMarkets()}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 