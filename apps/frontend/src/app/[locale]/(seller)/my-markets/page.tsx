'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { DataTable, Column } from '@/components/ui/data-table';
import { Market, getMarkets, PaginatedMarketsResponse } from '@/app/api/markets';
import UnAuthourized from '@/app/components/UnAuthourized';

export default function MyMarkets() {
  const { role, isLoaded, user } = useUser();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Market | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const columns: Column<Market>[] = [
    { key: 'name', label: 'Market', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (value) => new Date(String(value)).toLocaleDateString() },
    { key: 'startTime', label: 'Start Time', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const fetchMarkets = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const params: any = { page, limit: 10, userId: user._id };
      if (searchTerm) params.search = searchTerm;
      if (sortConfig.key) {
        params.sortBy = String(sortConfig.key);
        params.sortOrder = sortConfig.direction;
      }
      const res: PaginatedMarketsResponse = await getMarkets(params);
      setMarkets(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, [page, user?._id, searchTerm, sortConfig]);

  useEffect(() => {
    if (isLoaded && role === 'seller') {
      fetchMarkets();
    }
  }, [isLoaded, role, fetchMarkets]);

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
          onSearch={(term) => { setSearchTerm(term); setPage(1); }}
          onSort={(key, direction) => setSortConfig({ key: key as keyof Market, direction })}
          sortConfig={sortConfig}
          emptyStateMessage="No markets found"
          emptyStateDescription="You are not registered in any markets yet."
          className="mb-4"
        />

        {error && (
          <div className="mt-3 text-red-600 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}

