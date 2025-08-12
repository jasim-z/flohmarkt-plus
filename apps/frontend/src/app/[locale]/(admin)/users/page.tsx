'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { getUsers, User, GetUsersParams } from "../../../api/users";
import { FaUser, FaEnvelope, FaCalendar, FaUserShield, FaCheckCircle, FaTimesCircle, FaSearch, FaFilter } from "react-icons/fa";

export default function Users() {
  const t = useTranslations();
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
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = useCallback((page: number) => {
    const params: GetUsersParams = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      sortBy: sortConfig.key as string || undefined,
      sortOrder: sortConfig.direction,
    };
    fetchUsers(params);
  }, [fetchUsers, searchTerm, sortConfig]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      search: term || undefined,
      sortBy: sortConfig.key as string || undefined,
      sortOrder: sortConfig.direction,
    };
    fetchUsers(params);
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

  const columns: Column<User>[] = [
    {
      key: 'firstName',
      label: 'Name',
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FaUser className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-xs text-gray-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <FaEnvelope className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <FaUserShield className="h-4 w-4 text-gray-400" />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'admin' ? 'bg-red-100 text-red-800' : 
            value === 'seller' ? 'bg-blue-100 text-blue-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {value}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
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
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <FaCalendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {new Date(value).toLocaleDateString()}
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
          <DataTable
            data={users}
            columns={columns}
            pageSize={10}
            searchable={true}
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
          />
        </div>
      </div>
    </div>
  );
}