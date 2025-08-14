'use client';

import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaImage, FaUsers, FaTags, FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";
import { createMarket, CreateMarketRequest } from "../../../../api/markets";

interface CreateMarketForm {
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  bannerImage: string;
  vendorLimit?: number;
  boothsAvailable?: number;
  categories: string[];
}

export default function CreateMarket() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');

  // Predefined category suggestions
  const categorySuggestions = [
    'Antiques', 'Art', 'Books', 'Clothing', 'Electronics', 'Food', 'Furniture', 
    'Jewelry', 'Music', 'Sports', 'Toys', 'Vintage', 'Handmade', 'Collectibles'
  ];

  const [formData, setFormData] = useState<CreateMarketForm>({
    name: '',
    description: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    isActive: true,
    bannerImage: '',
    vendorLimit: undefined,
    boothsAvailable: undefined,
    categories: [],
  });

  const handleInputChange = (field: keyof CreateMarketForm, value: string | number | boolean | undefined) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Auto-fill booths available when vendor limit changes (1:1 logic)
      if (field === 'vendorLimit' && typeof value === 'number') {
        updated.boothsAvailable = value;
      }
      
      return updated;
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.location || !formData.date || !formData.startTime || !formData.endTime) {
        throw new Error('Please fill in all required fields');
      }

      // Validate time logic
      if (formData.startTime >= formData.endTime) {
        throw new Error('End time must be after start time');
      }

      // Validate date - market date should not be in the past
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        throw new Error('Market date cannot be in the past');
      }

      // Validate if market is happening today, ensure start time is in the future
      if (selectedDate.getTime() === today.getTime()) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
        const startTimeInMinutes = startHours * 60 + startMinutes;
        
        if (startTimeInMinutes <= currentTime) {
          throw new Error('If creating a market for today, start time must be in the future');
        }
      }

      // Ensure 1:1 logic - booths available equals vendor limit
      const finalBoothsAvailable = formData.vendorLimit || formData.boothsAvailable;
      
      const marketData: CreateMarketRequest = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive,
        bannerImage: formData.bannerImage,
        vendorLimit: formData.vendorLimit,
        boothsAvailable: finalBoothsAvailable,
        categories: formData.categories,
      };

      await createMarket(marketData);
      
      setSuccess('Market created successfully! The status will be automatically determined based on the date and time.');
      // Redirect to markets list on success
      router.push('/en/markets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market');
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Market</h1>
              <p className="text-gray-600">Add a new market to the system</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FaTimes className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FaSave className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Market Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaStore className="h-5 w-5 text-blue-600" />
                <span>Basic Information</span>
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter market name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the market..."
                  required
                />
              </div>
            </div>

            {/* Location and Date */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaMapMarkerAlt className="h-5 w-5 text-green-600" />
                <span>Location & Date</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter market location"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaTags className="h-5 w-5 text-purple-600" />
                <span>Categories</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a category..."
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>

                {/* Category Suggestions */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Quick add common categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {categorySuggestions.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          if (!formData.categories.includes(category)) {
                            setFormData(prev => ({
                              ...prev,
                              categories: [...prev.categories, category]
                            }));
                          }
                        }}
                        disabled={formData.categories.includes(category)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                          formData.categories.includes(category)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                {formData.categories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Selected categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          <span>{category}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(category)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Capacity Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaUsers className="h-5 w-5 text-orange-600" />
                <span>Capacity Settings</span>
              </h3>
              
              {/* 1:1 Logic Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <FaUsers className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">1:1 Vendor to Booth Allocation</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Each vendor will be allocated exactly one booth. The number of booths available will automatically match the vendor limit to ensure fair and equal space distribution.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Limit
                  </label>
                  <input
                    type="number"
                    value={formData.vendorLimit || ''}
                    onChange={(e) => handleInputChange('vendorLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="No limit"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booths Available
                    {formData.vendorLimit && formData.vendorLimit > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">
                        (Auto-filled: 1 booth per vendor)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.boothsAvailable || ''}
                    onChange={(e) => handleInputChange('boothsAvailable', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder={formData.vendorLimit && formData.vendorLimit > 0 ? "Auto-filled" : "Unlimited"}
                    min="1"
                    disabled={formData.vendorLimit !== undefined && formData.vendorLimit > 0}
                  />
                  {formData.vendorLimit && formData.vendorLimit > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Booths available automatically matches vendor limit for 1:1 allocation
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaImage className="h-5 w-5 text-indigo-600" />
                <span>Banner Image</span>
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.bannerImage}
                  onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaStore className="h-5 w-5 text-blue-600" />
                <span>Market Status</span>
              </h3>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Market is active and visible to users
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="h-4 w-4" />
                    <span>Create Market</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 