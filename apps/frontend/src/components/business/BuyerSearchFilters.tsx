'use client';

import { useState, useCallback, useRef } from 'react';
import { FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown, FaTag } from 'react-icons/fa';

interface SearchFiltersProps {
  onSearch: (search: string) => void;
  onFiltersChange: (filters: any) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

// Keep labels user-friendly, but send enum-safe values expected by backend
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'sports', label: 'Sports' },
  { value: 'toys', label: 'Toys' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'tools', label: 'Tools' },
  { value: 'baby_kids', label: 'Baby & Kids' },
  { value: 'pets', label: 'Pets' },
  { value: 'other', label: 'Other' },
];

export default function BuyerSearchFilters({ 
  onSearch, 
  onFiltersChange, 
  onSortChange, 
  onClearFilters,
  isLoading = false 
}: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    // If empty, clear the filter entirely so it isn't sent to API
    if (!category) {
      onFiltersChange({});
      return;
    }
    onFiltersChange({ category });
  }, [onFiltersChange]);

  const handleSortChange = useCallback((newSortBy: string) => {
    let newSortOrder: 'asc' | 'desc' = 'desc';
    
    if (newSortBy === sortBy) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    onSortChange(newSortBy, newSortOrder);
  }, [sortBy, sortOrder, onSortChange]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory('');
    setSearchTerm('');
    onClearFilters();
  }, [onClearFilters]);

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <FaSort className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? 
      <FaSortUp className="w-4 h-4 text-blue-600" /> : 
      <FaSortDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for items, categories, or locations..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category, Sort, and Clear Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <FaTag className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium"
              disabled={isLoading}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'createdAt', label: 'Date' },
                { key: 'price', label: 'Price' },
                { key: 'title', label: 'Title' },
                { key: 'viewCount', label: 'Popularity' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === key
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {getSortIcon(key)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedCategory || searchTerm) && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
