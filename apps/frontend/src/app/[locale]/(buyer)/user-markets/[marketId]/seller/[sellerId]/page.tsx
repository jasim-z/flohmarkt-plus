'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaBox, FaSearch, FaThLarge, FaListUl, FaStar, FaStore, FaFilter, FaTimes } from 'react-icons/fa';
import { getListingsBySellerAndMarket, GetListingsParams } from '@/app/api/listings';
import { getMarketDetails } from '@/app/api/markets';
import { Listing } from '@/app/api/listings';
import { Market, Vendor } from '@/app/api/markets';
import { useUser } from '@/contexts/UserContext';

export default function SellerItems() {
  const { marketId, sellerId, locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, isLoading: authLoading } = useUser();
  
  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [market, setMarket] = useState<Market | null>(null);
  const [seller, setSeller] = useState<Vendor | null>(null);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);
  const [sellerLoading, setSellerLoading] = useState(false); // No longer needed since we get vendor from URL
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchLoading, setSearchLoading] = useState(false);

  // Debouncing ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch market details
  const fetchMarket = useCallback(async () => {
    if (!marketId) return;
    
    try {
      setMarketLoading(true);
      const marketResponse = await getMarketDetails(marketId as string);
      setMarket(marketResponse.market);
    } catch (error) {
      console.error('Error fetching market:', error);
    } finally {
      setMarketLoading(false);
    }
  }, [marketId]);

  // Get seller information from URL query parameters
  const getSellerFromURL = useCallback(() => {
    const vendorParam = searchParams.get('vendor');
    if (vendorParam) {
      try {
        const vendorData = JSON.parse(decodeURIComponent(vendorParam));
        setSeller(vendorData);
        setSellerLoading(false);
      } catch (error) {
        console.error('Error parsing vendor data from URL:', error);
        // Fallback to minimal seller object
        setSeller({
          _id: sellerId as string,
          displayName: 'Seller',
          email: '',
          role: 'seller',
          isActive: true,
          createdAt: '',
          updatedAt: ''
        });
        setSellerLoading(false);
      }
    } else {
      // No vendor data in URL, create minimal seller object
      setSeller({
        _id: sellerId as string,
        displayName: 'Seller',
        email: '',
        role: 'seller',
        isActive: true,
        createdAt: '',
        updatedAt: ''
      });
      setSellerLoading(false);
    }
  }, [searchParams, sellerId]);

  // Fetch listings for the seller in this market
  const fetchListings = useCallback(async (params: GetListingsParams = {}) => {
    if (!marketId || !sellerId) return;
    
    try {
      setListingsLoading(true);
      const response = await getListingsBySellerAndMarket(sellerId as string, marketId as string, params);
      setListings(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setListingsLoading(false);
    }
  }, [marketId, sellerId]);

  // Initial data fetch - only for buyers
  useEffect(() => {
    if (user && user.role === 'buyer' && marketId && sellerId) {
      fetchMarket();
      getSellerFromURL(); // Get seller from URL instead of API call
      fetchListings();
    }
  }, [user, marketId, sellerId, fetchMarket, getSellerFromURL, fetchListings]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    const params: GetListingsParams = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };
    fetchListings(params);
  }, [fetchListings, searchTerm, sortBy, sortOrder]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchLoading(true);
      const params: GetListingsParams = {
        page: 1,
        limit: 10,
        search: term || undefined,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      };
      fetchListings(params).finally(() => {
        setSearchLoading(false);
      });
    }, 500); // 500ms delay
  }, [fetchListings, sortBy, sortOrder]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    const newOrder = sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(key);
    setSortOrder(newOrder);
    
    const params: GetListingsParams = {
      page: 1,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: key,
      sortOrder: newOrder,
    };
    fetchListings(params);
  }, [fetchListings, searchTerm, sortBy, sortOrder]);

  // Filtered listings based on search
  const filteredListings = listings.filter(listing => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      listing.title.toLowerCase().includes(searchLower) ||
      listing.description.toLowerCase().includes(searchLower) ||
      listing.category.toLowerCase().includes(searchLower) ||
      (listing.tags && listing.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });



  // Auth check - same logic as market details page
  useEffect(() => {
    console.log('Auth check triggered - isLoaded:', isLoaded, 'authLoading:', authLoading, 'user:', user, 'user.role:', user?.role);
    if (isLoaded && !authLoading) {
      if (!user) {
        console.log('user not found, redirecting to login');
        router.replace(`/${locale}/login`);
      } else if (user.role === 'seller') {
        console.log('user is seller, redirecting to overview');
        router.replace(`/${locale}/overview`);
      } else if (user.role === 'admin') {
        console.log('user is admin, redirecting to dashboard');
        router.replace(`/${locale}/dashboard`);
      } else if (user.role === 'buyer') {
        console.log('user is buyer, proceeding to page');
      } else {
        console.log('unknown role:', user.role);
      }
    }
  }, [user, isLoaded, authLoading, router, locale]);

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (marketLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading market details...</p>
        </div>
      </div>
    );
  }

  if (!market || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Found</h2>
          <p className="text-gray-600">Market or seller not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Market</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {seller.displayName}&apos;s Items
              </h1>
              <p className="text-gray-600 mt-1">
                Browse all items from this seller at {market.name}
              </p>
            </div>
            
            {/* Market Info */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Market</div>
              <div className="font-medium text-gray-900">{market.name}</div>
            </div>
          </div>
        </div>

        {/* Seller Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            {/* Seller Avatar */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-16 h-16 flex items-center justify-center">
              {seller.avatar ? (
                <img 
                  src={seller.avatar} 
                  alt={seller.displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaStore className="text-blue-600 w-8 h-8" />
              )}
            </div>

            {/* Seller Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {seller.displayName}
                </h2>
                {seller.isVerified && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                    Verified
                  </span>
                )}
              </div>

              {/* Rating */}
              {seller.rating && (
                <div className="flex items-center space-x-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(seller.rating!) 
                          ? 'text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {seller.rating.toFixed(1)} ({seller.totalReviews || 0} reviews)
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <FaStore className="w-3 h-3 text-green-500" />
                  <span>{totalItems} items in this market</span>
                </div>
                {seller.totalSales && (
                  <div className="flex items-center space-x-1">
                    <FaStore className="w-3 h-3 text-blue-500" />
                    <span>{seller.totalSales} total sales</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <div className="flex space-x-1">
                {[
                  { key: 'createdAt', label: 'Date' },
                  { key: 'price', label: 'Price' },
                  { key: 'title', label: 'Title' },
                  { key: 'viewCount', label: 'Popularity' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === key
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      {sortBy === key && (
                        <span className="text-xs">
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
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

        {/* Items Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {listingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 mx-auto mb-4 animate-spin"></div>
                <p className="text-gray-600">Loading items...</p>
              </div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No items found' : 'No items listed'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No listings found matching "${searchTerm}". Try adjusting your search terms.`
                  : "This seller hasn't listed any items in this market yet."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredListings.length} of {totalItems} items
              </div>

              {/* Items Grid/List */}
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${listing.title}`}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                              ${listing.price.toFixed(2)}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                            {listing.condition}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200">
                          Buy Now
                        </button>
                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200">
                          Message Seller
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 