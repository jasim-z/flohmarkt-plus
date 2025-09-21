'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"
import { FaChevronUp, FaChevronDown, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa"

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  loading?: boolean;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortConfig?: { key: keyof T | null; direction: 'asc' | 'desc' };
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  onRowClick?: (row: T) => void;
}

function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  searchable = false,
  loading = false,
  totalItems,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
  onSort,
  sortConfig,
  emptyStateMessage = "No data available",
  emptyStateDescription = "There are no items to display.",
  onRowClick,
  className,
  ...props
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [localPage, setLocalPage] = useState(1)

  const isServerSide = totalItems !== undefined && onPageChange !== undefined

  const filteredData = useMemo(() => {
    if (isServerSide) return data
    
    let filtered = data
    if (searchTerm) {
      filtered = data.filter((row) =>
        columns.some((col) => {
          const value = col.key === 'string' ? (row as any)[col.key] : (row as any)[col.key as keyof T]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }
    return filtered
  }, [data, searchTerm, columns, isServerSide])

  const paginatedData = useMemo(() => {
    if (isServerSide) return filteredData
    
    const start = (localPage - 1) * pageSize
    const end = start + pageSize
    return filteredData.slice(start, end)
  }, [filteredData, localPage, pageSize, isServerSide])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (onSearch) {
      onSearch(term)
    } else {
      setLocalPage(1)
    }
  }

  const handleSort = (key: string) => {
    if (!onSort) return
    
    const direction = sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    onSort(key, direction)
  }

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    } else {
      setLocalPage(page)
    }
  }

  const currentPageData = isServerSide ? currentPage : localPage
  const totalPagesData = isServerSide ? totalPages : Math.ceil(filteredData.length / pageSize)

  if (loading) {
    return (
      <div className={cn("rounded-md border bg-white", className)} {...props}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (paginatedData.length === 0) {
    return (
      <div className={cn("rounded-md border bg-white", className)} {...props}>
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyStateMessage}</h3>
          <p className="text-gray-500">{emptyStateDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border bg-white", className)} {...props}>
      {searchable && (
        <div className="p-4 border-b">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && onSort && (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <FaChevronUp className="w-3 h-3" />
                          ) : (
                            <FaChevronDown className="w-3 h-3" />
                          )
                        ) : (
                          <div className="w-3 h-3 flex flex-col">
                            <FaChevronUp className="w-2 h-2 -mb-1" />
                            <FaChevronDown className="w-2 h-2" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "hover:bg-gray-50",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? (
                      column.render((row as any)[column.key as keyof T], row)
                    ) : (
                      <div className="text-sm text-gray-900">
                        {String((row as any)[column.key as keyof T] || '')}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPagesData > 1 && (
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPageData - 1) * pageSize) + 1} to {Math.min(currentPageData * pageSize, isServerSide ? (totalItems || 0) : filteredData.length)} of {isServerSide ? (totalItems || 0) : filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPageData - 1)}
              disabled={currentPageData <= 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPageData} of {totalPagesData}
            </span>
            <button
              onClick={() => handlePageChange(currentPageData + 1)}
              disabled={currentPageData >= totalPagesData}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }
