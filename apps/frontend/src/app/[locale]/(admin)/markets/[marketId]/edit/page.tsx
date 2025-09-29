'use client';

import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaStore, FaMapMarkerAlt, FaCalendar, FaClock, FaImage, FaUsers, FaTags, FaArrowLeft, FaSave, FaTimes, FaPlus, FaUpload, FaTrash } from "react-icons/fa";
import { getMarketDetails, updateMarket, Market, CreateMarketRequest } from "../../../../../api/markets";
import { uploadFile, validateFile, createPreviewUrl, revokePreviewUrl, UploadedImage } from "@/app/lib/uploadUtils";

interface EditMarketForm {
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  bannerImage: string;
  additionalImages: string[];
  vendorLimit?: number;
  boothsAvailable?: number;
  categories: string[];
}

export default function EditMarket() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const marketId = params.marketId as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [market, setMarket] = useState<Market | null>(null);
  
  // Image upload state
  const [bannerImage, setBannerImage] = useState<UploadedImage | null>(null);
  const [additionalImages, setAdditionalImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<any[]>([]);

  // Predefined category suggestions
  const categorySuggestions = [
    'Antiques', 'Art', 'Books', 'Clothing', 'Electronics', 'Food', 'Furniture', 
    'Jewelry', 'Music', 'Sports', 'Toys', 'Vintage', 'Handmade', 'Collectibles'
  ];

  const [formData, setFormData] = useState<EditMarketForm>({
    name: '',
    description: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    isActive: true,
    bannerImage: '',
    additionalImages: [],
    vendorLimit: undefined,
    boothsAvailable: undefined,
    categories: [],
  });

  // Fetch market data on component mount
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setFetching(true);
        const details = await getMarketDetails(marketId);
        const foundMarket = details.market as unknown as Market;

        if (!foundMarket || (!foundMarket._id && !(foundMarket as any).id)) {
          setError('Market not found');
          return;
        }
        
        setMarket(foundMarket);
        
        // Format date for input field (YYYY-MM-DD)
        const marketDate = new Date(foundMarket.date);
        const formattedDate = marketDate.toISOString().split('T')[0];
        
        setFormData({
          name: foundMarket.name,
          description: foundMarket.description,
          location: foundMarket.location,
          date: formattedDate,
          startTime: foundMarket.startTime,
          endTime: foundMarket.endTime,
          isActive: foundMarket.isActive,
          bannerImage: foundMarket.bannerImage,
          additionalImages: Array.isArray(foundMarket.additionalImages) ? foundMarket.additionalImages : [],
          vendorLimit: foundMarket.vendorLimit,
          boothsAvailable: foundMarket.boothsAvailable,
          categories: Array.isArray(foundMarket.categories) ? foundMarket.categories : [],
        });

        // Pre-fill existing images
        if (foundMarket.bannerImage) {
          const bannerPreviewUrl = createPreviewUrl(new File([], 'banner.jpg', { type: 'image/jpeg' }));
          setBannerImage({
            file: new File([], 'banner.jpg', { type: 'image/jpeg' }),
            url: foundMarket.bannerImage,
            key: foundMarket.bannerImage,
            previewUrl: bannerPreviewUrl
          });
        }

        if (foundMarket.additionalImages && foundMarket.additionalImages.length > 0) {
          const additionalImagesData = foundMarket.additionalImages.map((url, index) => {
            const previewUrl = createPreviewUrl(new File([], `additional-${index}.jpg`, { type: 'image/jpeg' }));
            return {
              file: new File([], `additional-${index}.jpg`, { type: 'image/jpeg' }),
              url: url,
              key: url,
              previewUrl: previewUrl
            };
          });
          setAdditionalImages(additionalImagesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market');
      } finally {
        setFetching(false);
      }
    };

    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (bannerImage) {
        revokePreviewUrl(bannerImage.previewUrl);
      }
      additionalImages.forEach(image => {
        revokePreviewUrl(image.previewUrl);
      });
    };
  }, [bannerImage, additionalImages]);

  const handleInputChange = (field: keyof EditMarketForm, value: string | number | boolean | undefined) => {
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

  const handleBannerImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Only take the first file for banner
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      const result = await uploadFile(file, 'market_banner', marketId, {
        onProgress: (progress) => {
          setUploadProgress(prev => [...prev.filter(p => p.file.name !== file.name), progress]);
        }
      });

      const previewUrl = createPreviewUrl(file);
      const uploadedImage: UploadedImage = {
        file,
        url: result.url,
        key: result.key,
        previewUrl
      };

      // Clean up old banner image preview
      if (bannerImage) {
        revokePreviewUrl(bannerImage.previewUrl);
      }

      setBannerImage(uploadedImage);
      setFormData(prev => ({ 
        ...prev, 
        bannerImage: result.url 
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload banner image');
    }
  };

  const handleAdditionalImagesUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (additionalImages.length + files.length > 3) {
      setError('Maximum 3 additional images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return false;
      }
      return true;
    });

    // If no valid files after filtering, show a clear error
    if (validFiles.length === 0) {
      setError('No valid files to upload. Please check file size (max 10MB) and format (JPEG, PNG, GIF, WebP).');
      return;
    }

    for (const file of validFiles) {
      try {
        const result = await uploadFile(file, 'market_additional', marketId, {
          onProgress: (progress) => {
            setUploadProgress(prev => [...prev.filter(p => p.file.name !== file.name), progress]);
          }
        });

        const previewUrl = createPreviewUrl(file);
        const uploadedImage: UploadedImage = {
          file,
          url: result.url,
          key: result.key,
          previewUrl
        };

        setAdditionalImages(prev => [...prev, uploadedImage]);
        setFormData(prev => ({ 
          ...prev, 
          additionalImages: [...prev.additionalImages, result.url]
        }));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to upload image');
      }
    }
  };

  const removeBannerImage = () => {
    if (bannerImage) {
      revokePreviewUrl(bannerImage.previewUrl);
      setBannerImage(null);
      setFormData(prev => ({ ...prev, bannerImage: '' }));
    }
  };

  const removeAdditionalImage = (index: number) => {
    const imageToRemove = additionalImages[index];
    if (imageToRemove) {
      revokePreviewUrl(imageToRemove.previewUrl);
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({
        ...prev,
        additionalImages: prev.additionalImages.filter((_, i) => i !== index)
      }));
    }
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
          throw new Error('If editing a market for today, start time must be in the future');
        }
      }

      // Ensure 1:1 logic - booths available equals vendor limit
      const finalBoothsAvailable = formData.vendorLimit || formData.boothsAvailable;
      
      const marketData: Partial<CreateMarketRequest> = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive,
        bannerImage: formData.bannerImage,
        additionalImages: formData.additionalImages,
        vendorLimit: formData.vendorLimit,
        boothsAvailable: finalBoothsAvailable,
        categories: formData.categories,
      };

      await updateMarket(marketId, marketData);
      
      setSuccess('Market updated successfully! The status will be automatically determined based on the date and time.');
      
      // Redirect to markets list after a short delay
      setTimeout(() => {
        router.push('/en/markets');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update market');
    } finally {
      setLoading(false);
    }
  }, [formData, marketId, router]);

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading market...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !market) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <FaTimes className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error</h3>
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Market</h1>
              <p className="text-gray-600">Update market information</p>
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

        {/* Edit Market Form */}
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              
              {bannerImage ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={bannerImage.url}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeBannerImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Upload banner image</p>
                  <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF, WebP up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      handleBannerImageUpload(files);
                      // Clear the input value so the same file can be selected again
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="banner-upload"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                  >
                    <FaPlus className="h-4 w-4 mr-2" />
                    Choose Banner Image
                  </label>
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FaImage className="h-5 w-5 text-indigo-600" />
                <span>Additional Images</span>
              </h3>
              
              <div className="space-y-4">
                {/* Display existing additional images */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {additionalImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={`Additional ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                        >
                          <FaTrash className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add more images button */}
                {additionalImages.length < 3 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <FaUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 mb-2">Add more images</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        handleAdditionalImagesUpload(files);
                        // Clear the input value so the same file can be selected again
                        e.target.value = '';
                      }}
                      className="hidden"
                      id="additional-upload"
                    />
                    <label
                      htmlFor="additional-upload"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                    >
                      <FaPlus className="h-3 w-3 mr-1" />
                      Add Image
                    </label>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Maximum 3 additional images allowed. Each image should be under 10MB.
              </p>
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
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="h-4 w-4" />
                    <span>Update Market</span>
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