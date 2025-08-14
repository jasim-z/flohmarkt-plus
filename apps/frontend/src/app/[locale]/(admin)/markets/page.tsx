'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { Loading } from "@/components/ui/loading";
import { getMarkets, Market, GetMarketsParams } from "../../../api/markets";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaUsers, FaSearch, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

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

  const fetchMarkets = async (params: GetMarketsParams = {}) => {
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
  };

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

  const handlePageChange = useCallback((page: number) => {
    const params: GetMarketsParams = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: sortConfig.key as string || undefined,
      sortOrder: sortConfig.direction,
    };
    fetchMarkets(params);
  }, [searchTerm, sortConfig]);

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
  }, [sortConfig]);

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
  }, [searchTerm]);

  const handleRowClick = useCallback((market: Market) => {
    setNavigatingToMarket(market._id);
    router.push(`/en/markets/${market._id}`);
  }, [router]);

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

  const columns: Column<Market>[] = [
    {
      key: 'name',
      label: 'Market Name',
      sortable: true,
      render: (value: string | boolean | undefined, row: Market) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
            <FaStore className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {String(value || '')}
            </span>
            <span className="text-xs text-gray-500">{row.description}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: string | boolean | undefined, row: Market) => (
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
      render: (value: string | boolean | undefined, row: Market) => (
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
      sortable: true,
      render: (value: string | boolean | undefined, row: Market) => (
        <div className="flex items-center space-x-2">
          {value === 'ongoing' ? (
            <FaCheckCircle className="h-4 w-4 text-green-500" />
          ) : value === 'upcoming' ? (
            <FaExclamationTriangle className="h-4 w-4 text-blue-500" />
          ) : (
            <FaTimesCircle className="h-4 w-4 text-gray-500" />
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value as Market['status'])}`}>
            {getStatusLabel(value as Market['status'])}
          </span>
        </div>
      ),
    },
    {
      key: 'registeredVendors',
      label: 'Vendors',
      sortable: true,
      render: (value: string | boolean | undefined, row: Market) => (
        <div className="flex items-center space-x-2">
          <FaUsers className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {Array.isArray(value) ? value.length : 0} / {row.vendorLimit || '∞'}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: string | boolean | undefined, row: Market) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Markets Management
          </h1>
          <p className="text-gray-600">Manage and view all markets in the system</p>
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
            data={markets}
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
            onSort={handleSort}
            sortConfig={sortConfig}
            loading={loading}
            onRowClick={handleRowClick}
            navigatingToUser={navigatingToMarket}
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
    </div>
  );
}