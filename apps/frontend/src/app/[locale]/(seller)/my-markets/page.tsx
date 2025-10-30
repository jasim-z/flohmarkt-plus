'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { DataTable, Column } from '@/components/ui/data-table';
import { Market, getMarkets, PaginatedMarketsResponse } from '@/app/api/markets';
import UnAuthourized from '@/components/UnAuthourized';
import { Badge } from '@/components/ui/badge';
import { FaStore, FaCalendar, FaClock } from 'react-icons/fa';
import { useParams, useRouter } from 'next/navigation';

export default function MyMarkets() {
  const { role, isLoaded, user } = useUser();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Market | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [rawSearchInput, setRawSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const params = useParams();
  const router = useRouter();

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit'
  });

  const statusClasses = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<Market>[] = [
    {
      key: 'name',
      label: 'Market',
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
            <FaStore className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[260px]">{row.location}</div>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => (
        <div className="inline-flex items-center gap-2 text-gray-700">
          <FaCalendar className="text-gray-400" />
          <span className="font-medium">{formatDate(String(value))}</span>
        </div>
      )
    },
    {
      key: 'startTime',
      label: 'Time',
      sortable: true,
      render: (_value, row) => (
        <div className="inline-flex items-center gap-2 text-gray-700">
          <FaClock className="text-gray-400" />
          <span className="font-medium">{row.startTime} - {row.endTime}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge className={`${statusClasses(String(value))} px-3 py-1 rounded-full text-xs font-medium`}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</Badge>
      )
    }
  ];

  const fetchMarkets = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 10, userId: String(user.id) };
      if (searchTerm) params.search = searchTerm;
      if (sortConfig.key) {
        params.sortBy = String(sortConfig.key);
        params.sortOrder = sortConfig.direction;
      }
      
      const res: PaginatedMarketsResponse = await getMarkets(params);
      setMarkets(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, [page, user, searchTerm, sortConfig]);

  useEffect(() => {
    if (isLoaded && role === 'seller') {
      fetchMarkets();
    }
  }, [isLoaded, role, fetchMarkets]);

  // Debounced effect:
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(rawSearchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [rawSearchInput]);

  // On DataTable:
  // onSearch={(term) => {
  //   setRawSearchInput(term);
  //   setPage(1);
  // }}
  //
  // Debounce effect ONLY sets searchTerm:
  // useEffect(() => {
  //   if (debounceRef.current) clearTimeout(debounceRef.current);
  //   debounceRef.current = setTimeout(() => {
  //     setSearchTerm(rawSearchInput);
  //   }, 400);
  //   return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // }, [rawSearchInput]);

  if (isLoaded && role !== 'seller') {
    return <UnAuthourized />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Markets</h1>
        <p className="mt-1 text-sm text-gray-500">Markets you have joined as a vendor.</p>
      </div>

      {/* Card container for table, matching app theme */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <DataTable<Market>
          data={markets}
          columns={columns}
          pageSize={10}
          searchable
          loading={loading}
          // server-side
          totalItems={totalItems}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          onSearch={(term) => {
            setRawSearchInput(term);
            setPage(1);
          }}
          searchValue={rawSearchInput}
          onSort={(key, direction) => setSortConfig({ key: key as keyof Market, direction })}
          sortConfig={sortConfig}
          emptyStateMessage="No markets found"
          emptyStateDescription="You are not registered in any markets yet."
          className="mb-4"
          onRowClick={(row) => router.push(`/${params.locale}/explore-markets/${(row as Market)._id}`)}
        />

        {error && (
          <div className="mt-3 text-red-600 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}

