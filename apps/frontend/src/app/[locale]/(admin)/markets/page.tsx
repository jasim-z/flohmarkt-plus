'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { Loading } from "@/components/ui/loading";
import { getMarkets, Market, GetMarketsParams, deleteMarket } from "../../../api/markets";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaUsers, FaSearch, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaEdit, FaTrash } from "react-icons/fa";

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

export default function Markets() {
  const t = useTranslations();
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Market | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Debouncing ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [navigatingToMarket, setNavigatingToMarket] = useState<string | null>(null);
  const [statusUpdateTrigger, setStatusUpdateTrigger] = useState(0);
  
  // Edit and Delete state
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [deletingMarket, setDeletingMarket] = useState<Market | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchMarkets = useCallback(async (params: GetMarketsParams = {}) => {
    try {
      setLoading(true);
      const response = await getMarkets(params);
      setMarkets(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load of markets
  useEffect(() => {
    const loadMarkets = async () => {
      const params: GetMarketsParams = {
        page: 1,
        limit: 10,
        search: undefined,
        sortBy: undefined,
        sortOrder: 'asc',
      };
      await fetchMarkets(params);
    };
    loadMarkets();
  }, []); // Only run on mount

  // Timer to update market statuses every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    const params: GetMarketsParams = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: sortConfig.key as string || undefined,
      sortOrder: sortConfig.direction,
    };
    fetchMarkets(params);
  }, [searchTerm, sortConfig, fetchMarkets]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      const params: GetMarketsParams = {
        page: 1,
        limit: 10,
        search: term || undefined,
        sortBy: sortConfig.key as string || undefined,
        sortOrder: sortConfig.direction,
      };
      fetchMarkets(params);
    }, 500); // 500ms delay
  }, [sortConfig, fetchMarkets]);

  const handleSort = useCallback((key: keyof Market, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    
    const params: GetMarketsParams = {
      page: 1,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: key as string,
      sortOrder: direction,
    };
    
    fetchMarkets(params);
  }, [searchTerm, fetchMarkets]);

  const handleRowClick = useCallback((market: Market) => {
    setNavigatingToMarket(market._id);
    router.push(`/en/markets/${market._id}`);
  }, [router]);

  const handleEditMarket = useCallback((market: Market) => {
    setEditingMarket(market);
    router.push(`/en/markets/${market._id}/edit`);
  }, [router]);

  const handleDeleteMarket = useCallback((market: Market) => {
    setDeletingMarket(market);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteMarket = useCallback(async () => {
    if (!deletingMarket) return;
    
    try {
      setLoading(true);
      // TODO: Implement delete API call
      await deleteMarket(deletingMarket._id);
      setShowDeleteModal(false);
      setDeletingMarket(null);
      // Refresh markets list
      await fetchMarkets({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        sortBy: sortConfig.key as string || undefined,
        sortOrder: sortConfig.direction,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete market');
    } finally {
      setLoading(false);
    }
  }, [deletingMarket, currentPage, searchTerm, sortConfig, fetchMarkets]);

  const cancelDeleteMarket = useCallback(() => {
    setShowDeleteModal(false);
    setDeletingMarket(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    // Reset navigation state when user returns to the page
    const handleFocus = () => {
      setNavigatingToMarket(null);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Reset navigation state when component unmounts
      setNavigatingToMarket(null);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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
      month: 'short',
      day: 'numeric'
    });
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'Market Name',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
            <FaStore className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {String(value || '')}
            </span>
            <span className="text-xs text-gray-500">{String(row.description || '')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{String(value || '')}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <FaCalendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {value ? formatDate(String(value)) : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (value: unknown, row: Record<string, unknown>) => {
        const status = calculateMarketStatus(row as unknown as Market);
        return (
          <div className="flex items-center space-x-2">
            {status === 'ongoing' ? (
              <FaCheckCircle className="h-4 w-4 text-green-500" />
            ) : status === 'upcoming' ? (
              <FaExclamationTriangle className="h-4 w-4 text-blue-500" />
            ) : (
              <FaTimesCircle className="h-4 w-4 text-gray-500" />
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'registeredVendors',
      label: 'Vendors',
      sortable: false,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <FaUsers className="h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-700">
              {Array.isArray(value) ? value.length : 0} / {String(row.vendorLimit || '∞')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Active Status',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          {value ? (
            <FaCheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <FaTimesCircle className="h-4 w-4 text-red-500" />
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
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
              handleEditMarket(row as unknown as Market);
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Market"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMarket(row as unknown as Market);
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete Market"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <FaTimesCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error loading markets</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Markets Management
              </h1>
              <p className="text-gray-600">Manage and view all markets in the system</p>
            </div>
            <button
              onClick={() => router.push('/en/markets/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200"
            >
              <FaStore className="h-5 w-5" />
              <span>Create Market</span>
            </button>
          </div>
        </div>
        
        {/* Markets Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Custom Search Input with Debouncing */}
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {loading && (
                <div className="text-sm text-gray-500">
                  Searching...
                </div>
              )}
            </div>
          </div>
          
          <DataTable
            data={markets as unknown as Record<string, unknown>[]}
            columns={columns}
            pageSize={10}
            searchable={false}
            className="mb-8"
            // Server-side pagination props
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onSort={handleSort as (key: string, direction: 'asc' | 'desc') => void}
            sortConfig={sortConfig}
            loading={loading}
            onRowClick={handleRowClick as unknown as (row: Record<string, unknown>) => void}
            navigatingToUser={navigatingToMarket}
            // Empty state props
            searchTerm={searchTerm}
            emptyStateMessage={searchTerm ? 'No markets found' : 'No markets available'}
            emptyStateDescription={searchTerm 
              ? `No markets found matching "${searchTerm}". Try adjusting your search terms.`
              : 'There are no markets available at the moment. Create your first market to get started!'
            }
          />
        </div>
      </div>

      {/* Loading Overlay for Market Navigation */}
      {navigatingToMarket && (
        <Loading 
          variant="spinner" 
          size="lg" 
          text="Loading Market Details..." 
          overlay={true} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Market</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-semibold">&ldquo;{deletingMarket.name}&rdquo;</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently remove the market and all associated data.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteMarket}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMarket}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Deleting...' : 'Delete Market'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}