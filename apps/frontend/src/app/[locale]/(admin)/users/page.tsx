'use client';

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { getUsers, User, GetUsersParams } from "../../../api/users";
import { User as UserIcon, Mail, Calendar, Shield, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatar} alt={row.displayName} />
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{row.email}</span>
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
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Badge 
            variant={
              value === 'admin' ? 'destructive' : 
              value === 'seller' ? 'secondary' : 
              'default'
            }
          >
            {value}
          </Badge>
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
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Error loading users</h3>
                <div className="mt-2 text-sm text-destructive/80">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t("users.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage and view all users in the system
          </p>
        </div>
        
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
  );
}