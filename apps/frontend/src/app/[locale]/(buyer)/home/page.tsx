'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { getAllListings, GetListingsParams } from '../../../api/listings';
import { BuyerSearchFilters } from '@/components/business';
import { BuyerListingCard } from '@/components/business';
import { ListingSkeletonGrid } from '@/components';
import { InlineLoading } from '@/components/loading/LoadingOverlay';
import { FaShoppingBag, FaHeart, FaMapMarkerAlt, FaUsers, FaStore } from 'react-icons/fa';

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  category: string;
  condition: string;
  images?: string[];
  city: string;
  neighborhood: string;
  deliveryOption: string;
  shippingCost?: number;
  brand?: string;
  model?: string;
  originalPrice?: number;
  isNegotiable: boolean;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  marketId?: string;
  market?: {
    _id: string;
    name: string;
    location: string;
  };
  seller?: {
    _id: string;
    displayName: string;
    email: string;
  };
}

export default function BuyerHome() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded, isLoading: authLoading } = useUser();
  
  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastListingRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication and redirect to markets for buyers
  useEffect(() => {
    if (isLoaded && !authLoading) {
      if (!user) {
        router.replace(`/${params.locale}/login`);
      } else if (user.role === 'seller') {
        router.replace(`/${params.locale}/overview`);
      } else if (user.role === 'admin') {
        router.replace(`/${params.locale}/dashboard`);
      } else if (user.role === 'buyer') {
        router.replace(`/${params.locale}/home`);
      }
    }
  }, [user, isLoaded, authLoading, router, params.locale]);

  // Fetch listings with current parameters
  const fetchListings = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      const params: GetListingsParams = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
        ...filters
      };

      const response = await getAllListings(params);
      
      // Handle both new paginated response and legacy array response
      let listingsData: Listing[] = [];
      let paginationData = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      };

      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          // Legacy response - just an array of listings
          listingsData = response;
          paginationData = {
            page: 1,
            limit: listingsData.length,
            total: listingsData.length,
            totalPages: 1
          };
        } else if (response.data && response.pagination) {
          // New paginated response
          listingsData = response.data;
          paginationData = response.pagination;
        } else {
          // Fallback - assume it's a direct array
          listingsData = Array.isArray(response) ? response : [];
          paginationData = {
            page: 1,
            limit: listingsData.length,
            total: listingsData.length,
            totalPages: 1
          };
        }
      }
      
      if (append) {
        setListings(prev => [...prev, ...listingsData]);
      } else {
        setListings(listingsData);
      }
      
      setTotalItems(paginationData.total);
      setHasMore(paginationData.page < paginationData.totalPages);
      setCurrentPage(paginationData.page);
      
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, sortBy, sortOrder, filters]);

  // Initial load
  useEffect(() => {
    if (user && user.role === 'buyer') {
      fetchListings(1, false);
    }
  }, [user, fetchListings]);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setListings([]);
      setLoading(true);
      fetchListings(1, false);
    }, 300);
  }, [fetchListings]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setListings([]);
    setLoading(true);
    fetchListings(1, false);
  }, [fetchListings]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    setListings([]);
    setLoading(true);
    fetchListings(1, false);
  }, [fetchListings]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
    setListings([]);
    setLoading(true);
    fetchListings(1, false);
  }, [fetchListings]);

  // Infinite scroll setup
  const lastListingElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        fetchListings(currentPage + 1, true);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, currentPage, fetchListings]);

  // Handle favorite
  const handleFavorite = useCallback((listingId: string) => {
    // TODO: Implement favorite functionality
    console.log('Favorite:', listingId);
  }, []);

  // Handle view listing
  const handleViewListing = useCallback((listingId: string) => {
    // TODO: Navigate to listing detail page
    console.log('View listing:', listingId);
  }, []);

  // Loading state
  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InlineLoading text="Loading marketplace..." />
      </div>
    );
  }

  // Not authenticated
  if (!user || user.role !== 'buyer') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Discover Amazing Deals in Your Neighborhood
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Browse thousands of items from local sellers, find unique treasures, and support your community marketplace.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FaShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Active Listings</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FaStore className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-600">Markets</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FaUsers className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">Sellers</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FaMapMarkerAlt className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">25+</div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <BuyerSearchFilters
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          isLoading={loading}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'All Listings'}
            </h2>
            {totalItems > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {totalItems.toLocaleString()} items
              </span>
            )}
          </div>
          
          {listings.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {listings.length} of {totalItems.toLocaleString()}
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <ListingSkeletonGrid count={8} />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg font-semibold mb-2">{error}</div>
            <button
              onClick={() => fetchListings(1, false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg font-semibold mb-2">
              {searchTerm || Object.keys(filters).some(key => filters[key]) 
                ? "No listings found matching your criteria" 
                : "No listings available at the moment"
              }
            </div>
            <p className="text-gray-400 mb-4">
              Try adjusting your search terms or filters
            </p>
            {(searchTerm || Object.keys(filters).some(key => filters[key])) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing, index) => (
              <div
                key={listing._id}
                ref={index === listings.length - 1 ? lastListingElementRef : null}
              >
                <BuyerListingCard
                  listing={listing}
                  onFavorite={handleFavorite}
                  onView={handleViewListing}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More Indicator */}
        {loadingMore && (
          <InlineLoading text="Loading more items..." />
        )}

        {/* End of Results */}
        {!hasMore && listings.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">
              You&apos;ve reached the end of all available listings
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 