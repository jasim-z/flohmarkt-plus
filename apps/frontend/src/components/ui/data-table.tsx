'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { FaSearch, FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  className?: string;
  // Server-side pagination props
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (searchTerm: string) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortConfig?: {
    key: keyof T | null;
    direction: 'asc' | 'desc';
  };
  loading?: boolean;
  onRowClick?: (row: T) => void;
  navigatingToUser?: string | null;
  // Empty state props
  searchTerm?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  className = '',
  // Server-side pagination props
  totalItems,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange,
  onSearch,
  onSort,
  sortConfig: externalSortConfig,
  loading = false,
  onRowClick,
  navigatingToUser,
  // Empty state props
  searchTerm: externalSearchTerm,
  emptyStateMessage,
  emptyStateDescription,
}: DataTableProps<T>) {
  
  // Debug logging
  console.log('DataTable received data:', data);
  console.log('DataTable received columns:', columns);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Debouncing ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use external values if provided (server-side pagination)
  const isServerSide = !!onPageChange;
  const displayCurrentPage = isServerSide ? externalCurrentPage || 1 : currentPage;
  const displayTotalPages = isServerSide ? externalTotalPages || 1 : Math.ceil(data.length / pageSize);
  const displaySortConfig = useMemo(() => 
    isServerSide ? externalSortConfig || { key: null, direction: 'asc' } : sortConfig,
    [isServerSide, externalSortConfig, sortConfig]
  );

  // For server-side search, always use local search term for input control
  // This ensures the input is properly controlled by the DataTable's own state
  // We completely ignore external search term to prevent input clearing
  // The input will always show what the user typed, regardless of external state
  const displaySearchTerm = searchTerm;
  
  // Prevent external search term from interfering with local state
  useEffect(() => {
    // If external search term changes but we have a local search term, keep the local one
    if (externalSearchTerm && searchTerm && externalSearchTerm !== searchTerm) {
      // Keep local search term, don't sync with external
    }
  }, [externalSearchTerm, searchTerm]);
  
  // Ensure search term persists across re-renders - but only once to prevent loops
  useEffect(() => {
    // If we have a search term but it gets reset, restore it
    if (searchTerm === '' && externalSearchTerm && externalSearchTerm !== '') {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]); // Only depend on externalSearchTerm, not searchTerm

  // For server-side search, we don't sync external search term to avoid conflicts
  // The DataTable manages its own search input state independently
  // The parent component only gets the search term when user explicitly searches

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  // For client-side pagination, filter and sort data
  const filteredData = useMemo(() => {
    if (isServerSide || !searchTerm) return data;
    
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns, isServerSide]);

  // Sort data (client-side only)
  const sortedData = useMemo(() => {
    if (isServerSide || !displaySortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[displaySortConfig.key!] as T[keyof T];
      const bValue = b[displaySortConfig.key!] as T[keyof T];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return displaySortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, displaySortConfig, isServerSide]);

  // Paginate data (client-side only)
  const paginatedData = useMemo(() => {
    if (isServerSide) return data;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, isServerSide, data]);

  const handleSort = (key: keyof T) => {
    if (isServerSide && onSort) {
      const newDirection = displaySortConfig.key === key && displaySortConfig.direction === 'asc' ? 'desc' : 'asc';
      onSort(key, newDirection);
    } else {
      setSortConfig((prev) => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
      setCurrentPage(1);
    }
  };

  const handleSearch = (value: string) => {
    // Always update local search term for controlled input
    setSearchTerm(value);
    
    if (isServerSide && onSearch) {
      // For server-side, implement debounced search
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(value);
      }, 500); // 500ms delay
    } else {
      setCurrentPage(1);
    }
  };

  const handleSearchSubmit = () => {
    if (isServerSide && onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isServerSide && onSearch) {
      onSearch(searchTerm);
    }
  };

  const getSortIcon = (key: keyof T) => {
    if (displaySortConfig.key !== key) {
      return <FaChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return displaySortConfig.direction === 'asc' ? (
      <FaChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <FaChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Type to search, then click Search or press Enter"
              value={displaySearchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-8"
            />

          </div>
          {isServerSide && onSearch && (
            <>
              <button
                onClick={handleSearchSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                Search
              </button>
              {displaySearchTerm && (
                <button
                  onClick={() => {
                    console.log('Clear button clicked, clearing local search term');
                    setSearchTerm('');
                    // Call onSearch with the original search term to refresh results
                    // This will show all results since searchTerm is now empty
                    if (isServerSide && onSearch) {
                      onSearch('');
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    column.sortable && "cursor-pointer hover:bg-gray-50"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state message
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="text-gray-400">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {externalSearchTerm ? (emptyStateMessage || 'No results found') : (emptyStateMessage || 'No data available')}
                    </div>
                    <div className="text-sm text-gray-500 max-w-sm">
                      {externalSearchTerm 
                        ? (emptyStateDescription || `No results found matching "${externalSearchTerm}". Try adjusting your search terms.`)
                        : (emptyStateDescription || 'There are no items available at the moment.')
                      }
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                // Check if this row is being navigated to
                const isNavigating = navigatingToUser && (row as Record<string, unknown>)._id === navigatingToUser;
                
                return (
                  <TableRow
                    key={index}
                    onClick={() => onRowClick?.(row)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isNavigating 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        <div className="flex items-center space-x-2">
                          {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                          {isNavigating && (
                            <Loading variant="spinner" size="sm" />
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {displayTotalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500">
            {isServerSide && totalItems ? (
              <>
                Showing {((displayCurrentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(displayCurrentPage * pageSize, totalItems)} of {totalItems} results
              </>
            ) : (
              <>
                Showing {((displayCurrentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(displayCurrentPage * pageSize, paginatedData.length)} of {paginatedData.length} results
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.max(1, displayCurrentPage - 1);
                if (isServerSide && onPageChange) {
                  onPageChange(newPage);
                } else {
                  setCurrentPage(newPage);
                }
              }}
              disabled={displayCurrentPage === 1}
            >
              <FaChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
              let pageNum;
              if (displayTotalPages <= 5) {
                pageNum = i + 1;
              } else if (displayCurrentPage <= 3) {
                pageNum = i + 1;
              } else if (displayCurrentPage >= displayTotalPages - 2) {
                pageNum = displayTotalPages - 4 + i;
              } else {
                pageNum = displayCurrentPage - 2 + i;
              }
              
              // Ensure both values are numbers for comparison
              const currentPageNum = Number(displayCurrentPage);
              const buttonVariant = currentPageNum === pageNum ? "default" : "outline";
              const isCurrentPage = currentPageNum === pageNum;
              
              return (
                <Button
                  key={pageNum}
                  variant={buttonVariant}
                  size="sm"
                  onClick={() => {
                    if (isServerSide && onPageChange) {
                      onPageChange(pageNum);
                    } else {
                      setCurrentPage(pageNum);
                    }
                  }}
                  className={`debug-button-${pageNum}`}
                  style={{
                    backgroundColor: isCurrentPage ? '#2563eb' : 'white',
                    color: isCurrentPage ? 'white' : '#374151',
                    border: isCurrentPage ? 'none' : '1px solid #d1d5db'
                  }}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.min(displayTotalPages, displayCurrentPage + 1);
                if (isServerSide && onPageChange) {
                  onPageChange(newPage);
                } else {
                  setCurrentPage(newPage);
                }
              }}
              disabled={displayCurrentPage === displayTotalPages}
            >
              <FaChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 