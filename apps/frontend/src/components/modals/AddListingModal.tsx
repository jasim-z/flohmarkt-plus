'use client';

import { useState, useCallback, useEffect } from 'react';
import { FaTimes, FaUpload, FaMapMarkerAlt, FaCalendar, FaDollarSign, FaBox, FaTag, FaTruck, FaInfoCircle } from 'react-icons/fa';
import { CreateListingRequest, createListingForMarket } from '@/app/api/listings';
import { formatPrice } from '@/lib/utils';
import { ListingImageUpload } from '@/components';


interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
  marketId: string;
  marketName: string;
  marketLocation: string;
}

export default function AddListingModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  marketId, 
  marketName, 
  marketLocation 
}: AddListingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateListingRequest>({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    category: '',
    condition: '',
    images: [],
    city: '',
    neighborhood: '',
    latitude: 0,
    longitude: 0,
    deliveryOption: 'pickup_only',
    shippingCost: 0,
    // Don't set default values for optional fields
    brand: undefined,
    model: undefined,
    originalPrice: undefined,
    dimensions: undefined,
    weight: undefined,
    tags: [],
    isNegotiable: false,
    pickupAddress: undefined,
    pickupInstructions: undefined,
  });

  const [errors, setErrors] = useState<Partial<CreateListingRequest>>({});


  // Pre-fill location data from market
  useEffect(() => {
    if (marketLocation) {
      // Extract city and neighborhood from market location
      const locationParts = marketLocation.split(',').map(part => part.trim());
      setFormData(prev => ({
        ...prev,
        city: locationParts[0] || '',
        neighborhood: locationParts[1] || '',
        // For now, use default coordinates (you might want to get these from the market)
        latitude: 40.7128, // Default to NYC coordinates
        longitude: -74.0060,
      }));
    }
  }, [marketLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof CreateListingRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateListingRequest> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Neighborhood is required';
    if (!formData.isFree && formData.price <= 0) newErrors.price = 'Price is required for non-free items';
    // Images are now optional - removed validation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Clean up the data before sending
      const cleanData = { ...formData };
      
      // Remove empty strings, undefined, and null values for optional fields
      const optionalStringFields = ['brand', 'model', 'dimensions', 'weight', 'pickupAddress', 'pickupInstructions'];
      optionalStringFields.forEach(field => {
        const value = cleanData[field as keyof typeof cleanData];
        if (value === '' || value === undefined || value === null) {
          delete cleanData[field as keyof typeof cleanData];
        }
      });
      
      // Remove zero, undefined, and null values for optional numeric fields
      if (cleanData.originalPrice === 0 || cleanData.originalPrice === undefined || cleanData.originalPrice === null) {
        delete cleanData.originalPrice;
      }
      
      // Only include shippingCost if delivery option requires it and it's greater than 0
      if (cleanData.deliveryOption !== 'shipping' && (cleanData.shippingCost === 0 || cleanData.shippingCost === undefined || cleanData.shippingCost === null)) {
        delete cleanData.shippingCost;
      }

      const listingData = {
        ...cleanData,
        images: cleanData.images || [],
      };
      
      await createListingForMarket(marketId, listingData);
      
      // Close modal and refresh listings immediately
      onSuccess('Listing created successfully!');
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: 0,
        isFree: false,
        category: '',
        condition: '',
        images: [],
        city: '',
        neighborhood: '',
        latitude: 0,
        longitude: 0,
        deliveryOption: 'pickup_only',
        shippingCost: 0,
        // Don't set default values for optional fields
        brand: undefined,
        model: undefined,
        originalPrice: undefined,
        dimensions: undefined,
        weight: undefined,
        tags: [],
        isNegotiable: false,
        pickupAddress: undefined,
        pickupInstructions: undefined,
      });
      
    } catch (error) {
      console.error('Failed to create listing:', error);
      // For now, just log the error since we don't have toast in this component
      console.error('Failed to create listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Creating listing...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New Listing</h2>
            <p className="text-gray-600">Create a new listing for {marketName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-2 transition-colors duration-200 ${
              isSubmitting 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter item title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="sports">Sports</option>
                <option value="toys">Toys</option>
                <option value="home_garden">Home & Garden</option>
                <option value="automotive">Automotive</option>
                <option value="collectibles">Collectibles</option>
                <option value="art">Art</option>
                <option value="music">Music</option>
                <option value="tools">Tools</option>
                <option value="baby_kids">Baby & Kids</option>
                <option value="pets">Pets</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your item in detail"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Product Images */}
          <ListingImageUpload
            images={formData.images || []}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            maxImages={5}
            disabled={isSubmitting}
          />

          {/* Price and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.condition ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={formData.isFree}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  } ${formData.isFree ? 'bg-gray-100' : ''}`}
                  placeholder="0.00"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Free</span>
                </label>
              </div>
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter city"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neighborhood *
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.neighborhood ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter neighborhood"
              />
              {errors.neighborhood && <p className="text-red-500 text-sm mt-1">{errors.neighborhood}</p>}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Option *
              </label>
              <select
                name="deliveryOption"
                value={formData.deliveryOption}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pickup_only">Pickup Only</option>
                <option value="local_delivery">Local Delivery</option>
                <option value="shipping">Shipping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Cost
              </label>
              <input
                type="number"
                name="shippingCost"
                value={formData.shippingCost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter model"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
            />
            <p className="text-sm text-gray-500 mt-1">Separate tags with commas (e.g., vintage, handmade, unique)</p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FaUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload images of your item (optional)</p>
                <p className="text-sm text-gray-500">Drag and drop images here, or click to browse. Images help buyers see your item better.</p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  // TODO: Implement image upload logic
                  const files = Array.from(e.target.files || []);
                  const imageUrls = files.map(file => URL.createObjectURL(file));
                  setFormData(prev => ({ ...prev, images: imageUrls }));
                }}
              />
            </div>
            {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isNegotiable"
                  checked={formData.isNegotiable}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Price is negotiable</span>
              </label>
            </div>
          </div>

          {/* Pickup Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Address
              </label>
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pickup address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Instructions
              </label>
              <input
                type="text"
                name="pickupInstructions"
                value={formData.pickupInstructions}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pickup instructions"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FaBox className="h-4 w-4" />
                  <span>Create Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 