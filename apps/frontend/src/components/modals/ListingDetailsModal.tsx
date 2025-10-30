'use client';

import { FaTimes, FaMapMarkerAlt, FaClock, FaDollarSign, FaBox, FaTag, FaInfoCircle, FaHeart, FaShare, FaExpand, FaChevronLeft, FaChevronRight, FaStar, FaEye, FaCalendarAlt } from "react-icons/fa";
import { Listing } from '../api/listings';
import { useState } from 'react';

interface ListingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
}

export default function ListingDetailsModal({ 
  isOpen, 
  onClose, 
  listing 
}: ListingDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);

  if (!isOpen || !listing) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      'new': 'bg-green-100 text-green-800',
      'like_new': 'bg-blue-100 text-blue-800',
      'excellent': 'bg-purple-100 text-purple-800',
      'good': 'bg-yellow-100 text-yellow-800',
      'fair': 'bg-orange-100 text-orange-800',
      'poor': 'bg-red-100 text-red-800'
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'electronics': 'bg-blue-100 text-blue-800',
      'clothing': 'bg-pink-100 text-pink-800',
      'home': 'bg-green-100 text-green-800',
      'sports': 'bg-orange-100 text-orange-800',
      'books': 'bg-purple-100 text-purple-800',
      'toys': 'bg-yellow-100 text-yellow-800',
      'art': 'bg-indigo-100 text-indigo-800',
      'automotive': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <FaBox className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{listing.title}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(listing.category)}`}>
                    {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(listing.condition)}`}>
                    {listing.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
                <FaShare className="h-5 w-5" />
              </button>
              <button className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
                <FaHeart className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Content Layout */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                {listing.images && listing.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-xl">
                        <img 
                          src={listing.images[currentImageIndex]} 
                          alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Image Navigation */}
                      {listing.images.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                            disabled={currentImageIndex === 0}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex(Math.min(listing.images.length - 1, currentImageIndex + 1))}
                            disabled={currentImageIndex === listing.images.length - 1}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaChevronRight className="h-5 w-5" />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {currentImageIndex + 1} / {listing.images.length}
                          </div>
                          
                          {/* Fullscreen Button */}
                          <button
                            onClick={() => setShowFullscreenGallery(true)}
                            className="absolute bottom-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200"
                          >
                            <FaExpand className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnail Grid */}
                    {listing.images.length > 1 && (
                      <div className="grid grid-cols-6 gap-3">
                        {listing.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 ${
                              index === currentImageIndex ? 'ring-4 ring-blue-500' : ''
                            }`}
                          >
                            <img 
                              src={image} 
                              alt={`${listing.title} - Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                    <FaBox className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                    <p className="text-gray-500 font-medium text-lg">No images available</p>
                    <p className="text-gray-400 text-sm mt-2">This listing doesn't have any images yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="space-y-6">
              {/* Price Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="text-center">
                  {listing.isFree ? (
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-green-600">FREE</div>
                      <p className="text-green-700 font-medium">No cost to you!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-gray-900">{formatPrice(listing.price)}</div>
                      {listing.originalPrice && listing.originalPrice > listing.price && (
                        <div className="text-lg text-gray-500 line-through">
                          {formatPrice(listing.originalPrice)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-center space-x-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      listing.isNegotiable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaInfoCircle className="h-5 w-5 text-blue-600 mr-3" />
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{listing.description}</p>
              </div>

              {/* Location & Delivery */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaMapMarkerAlt className="h-5 w-5 text-green-600 mr-3" />
                  Location & Delivery
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">City</span>
                    <span className="font-medium text-gray-900">{listing.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Neighborhood</span>
                    <span className="font-medium text-gray-900">{listing.neighborhood}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800`}>
                      {listing.deliveryOption.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {listing.deliveryOption === 'shipping' && listing.shippingCost && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Shipping Cost</span>
                      <span className="font-medium text-gray-900">{formatPrice(listing.shippingCost)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {(listing.brand || listing.model || listing.dimensions || listing.weight) && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaBox className="h-5 w-5 text-purple-600 mr-3" />
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                    {listing.brand && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Brand</span>
                        <span className="font-medium text-gray-900">{listing.brand}</span>
                      </div>
                    )}
                    {listing.model && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Model</span>
                        <span className="font-medium text-gray-900">{listing.model}</span>
                      </div>
                    )}
                    {listing.dimensions && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Dimensions</span>
                        <span className="font-medium text-gray-900">{listing.dimensions}</span>
                      </div>
                    )}
                    {listing.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Weight</span>
                        <span className="font-medium text-gray-900">{listing.weight}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaTag className="h-5 w-5 text-orange-600 mr-3" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status & Dates */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaClock className="h-5 w-5 text-indigo-600 mr-3" />
                  Status & Dates
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      listing.status === 'active' ? 'bg-green-100 text-green-800' :
                      listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                      listing.status === 'expired' ? 'bg-red-100 text-red-800' :
                      listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <FaCalendarAlt className="h-4 w-4 mr-2" />
                      Created
                    </span>
                    <span className="font-medium text-gray-900">{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <FaEye className="h-4 w-4 mr-2" />
                      Updated
                    </span>
                    <span className="font-medium text-gray-900">{new Date(listing.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Image Gallery */}
        {showFullscreenGallery && listing.images && listing.images.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={() => setShowFullscreenGallery(false)}
                className="absolute top-6 right-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 z-10"
              >
                <FaTimes className="h-6 w-6" />
              </button>

              {/* Main Image */}
              <div className="relative max-w-5xl max-h-full">
                <img
                  src={listing.images[currentImageIndex]}
                  alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                
                {/* Navigation */}
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(Math.min(listing.images.length - 1, currentImageIndex + 1))}
                      disabled={currentImageIndex === listing.images.length - 1}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaChevronRight className="h-6 w-6" />
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium">
                      {currentImageIndex + 1} / {listing.images.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 