'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaSearch, 
  FaSort,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaStore
} from 'react-icons/fa';
import { getMarkets, Market } from '@/app/api/markets';
import MarketCard from '@/components/MarketCard';

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
  { value: 'startTime', label: 'Start Time' }
];


export default function BuyerMarkets() {
  const { user, isLoaded, isLoading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All Markets',
    status: 'all',
    sortBy: 'date',
    sortOrder: 'asc'
  });

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
    }
  }, [user]); // Remove filters dependency since we handle it separately above

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      
      // Prepare API parameters
      const apiParams = {
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
      
      const response = await getMarkets(cleanParams);
      setMarkets(response.data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use markets directly from backend - no frontend filtering
  const filteredMarkets = markets;

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'All Markets',
      status: 'all',
      sortBy: 'date',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = filters.search || filters.category !== 'All Markets' || filters.status !== 'all';

  const handleMarketClick = (marketId: string) => {
    router.push(`/${params.locale}/markets/${marketId}`);
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Discover Local Markets
            </h1>
            <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto">
              Find the best flea markets near you
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search markets, locations, or categories..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 md:py-4 text-gray-900 rounded-2xl border-0 shadow-lg focus:ring-2 focus:ring-primary-300 focus:outline-none text-base md:text-lg search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="flex items-center text-gray-700 font-medium">
              <FaFilter className="w-4 h-4 mr-2 text-primary-600" />
              Filters & Sorting
            </span>
            <FaChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showMobileFilters && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Market Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaStore className="w-4 h-4 text-primary-600" />
                <span className="text-gray-700 font-medium">
                  Explore {filteredMarkets.length} markets
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
                >
                  <FaTimes className="w-3 h-3" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>

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

      {/* Desktop Filters and Sorting */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FaStore className="w-5 h-5 text-primary-600" />
                <span className="text-gray-700 font-medium text-lg">
                  Explore {filteredMarkets.length} markets
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
                >
                  <FaTimes className="w-3 h-3" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Status Filter */}
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white hover:border-gray-400 transition-colors"
                >
                  <option value="all">All Markets</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Live Now</option>
                </select>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white hover:border-gray-400 transition-colors"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSortChange(filters.sortBy)}
                    className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
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
        </div>
      </div>

      {/* Featured Markets Section - Only show when no filters are applied */}
      {filteredMarkets.length > 0 && !hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Featured Markets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {filteredMarkets.slice(0, 4).map((market) => (
              <MarketCard
                key={market._id}
                market={market}
                variant="featured"
                onClick={() => handleMarketClick(market._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Markets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              onClick={fetchMarkets}
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
        )}
      </div>
    </div>
  );
} 