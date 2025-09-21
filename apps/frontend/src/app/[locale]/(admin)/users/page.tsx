'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { Loading } from "@/components/ui/loading";
import { getUsers, User, GetUsersParams } from "../../../api/users";
import { FaUser, FaEnvelope, FaCalendar, FaUserShield, FaCheckCircle, FaTimesCircle, FaSearch } from "react-icons/fa";
import { useUser } from "@/contexts/UserContext";
import UnAuthourized from "@/components/UnAuthourized";

export default function Users() {
  const t = useTranslations();
  const router = useRouter();
  const { role, isLoaded } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Debouncing ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async (params: GetUsersParams = {}) => {
    try {
      setLoading(true);
      const response = await getUsers(params);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const params: GetUsersParams = {
        page: 1,
        limit: 10,
        search: undefined,
        sortBy: sortConfig.key as string || 'createdAt',
        sortOrder: sortConfig.direction || 'desc',
      };
      await fetchUsers(params);
    };
    loadUsers();
  }, [fetchUsers, sortConfig]); // Only run once on mount

  const handlePageChange = useCallback((page: number) => {
    const params: GetUsersParams = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: sortConfig.key as string || 'createdAt',
      sortOrder: sortConfig.direction || 'desc',
    };
    fetchUsers(params);
  }, [fetchUsers, searchTerm, sortConfig]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      const params: GetUsersParams = {
        page: 1,
        limit: 10,
        search: term || undefined,
        sortBy: sortConfig.key as string || undefined,
        sortOrder: sortConfig.direction,
      };
      fetchUsers(params);
    }, 500); // 500ms delay
  }, [fetchUsers, sortConfig]);

  const handleSort = useCallback((key: keyof User, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: key as string,
      sortOrder: direction,
    };
    fetchUsers(params);
  }, [fetchUsers, searchTerm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const [navigatingToUser, setNavigatingToUser] = useState<string | null>(null);

  const handleRowClick = useCallback((user: User) => {
    setNavigatingToUser(user._id);
    router.push(`/en/users/${user._id}`);
  }, [router]);

  const columns: Column<User>[] = [
    {
      key: 'firstName',
      label: 'Name',
      sortable: true,
      render: (value: string | boolean | undefined, row: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FaUser className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {row.displayName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string | boolean | undefined, row: User) => (
        <div className="flex items-center space-x-2">
          <FaEnvelope className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{String(value || '')}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string | boolean | undefined, row: User) => (
        <div className="flex items-center space-x-2">
          <FaUserShield className="h-4 w-4 text-gray-400" />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'admin' ? 'bg-red-100 text-red-800' : 
            value === 'seller' ? 'bg-blue-100 text-blue-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {String(value || '')}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: string | boolean | undefined, row: User) => (
        <div className="flex items-center space-x-2">
          {value ? (
            <FaCheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <FaTimesCircle className="h-4 w-4 text-red-500" />
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined On',
      sortable: true,
      render: (value: string | boolean | undefined, row: User) => (
        <div className="flex items-center space-x-2">
          <FaCalendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {value ? new Date(String(value)).toLocaleDateString() : ''}
          </span>
        </div>
      ),
    },
  ];

  if (role !== 'admin' && isLoaded) return <UnAuthourized />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <FaTimesCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error loading users</h3>
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
            Users Management
          </h1>
          <p className="text-gray-600">Manage and view all users in the system</p>
        </div>
        
        {/* Users Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Custom Search Input with Debouncing */}
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
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
            data={users}
            columns={columns}
            pageSize={10}
            searchable={false}
            className="mb-2"
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
            navigatingToUser={navigatingToUser}
          />
        </div>
      </div>

      {/* Loading Overlay for User Navigation */}
      {navigatingToUser && (
        <Loading 
          variant="spinner" 
          size="lg" 
          text="Loading User Details..." 
          overlay={true} 
        />
      )}
    </div>
  );
}