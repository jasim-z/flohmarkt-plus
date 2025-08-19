'use client';

import { FaTimes, FaMapMarkerAlt, FaClock, FaDollarSign, FaBox, FaTag, FaInfoCircle } from "react-icons/fa";
import { Listing } from '../api/listings';

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
  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Listing Details</h2>
            <p className="text-gray-600">View details for {listing.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Images Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Images</h3>
            {listing.images && listing.images.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src={listing.images[0]} 
                      alt={`${listing.title} - Main Image`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      +{listing.images.length - 1} more
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Grid */}
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {listing.images.slice(1).map((image, index) => (
                      <div key={index + 1} className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                        <img 
                          src={image} 
                          alt={`${listing.title} - Image ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaBox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No images available</p>
                <p className="text-gray-400 text-sm">This listing doesn't have any images yet</p>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaBox className="h-5 w-5 text-blue-600 mr-3" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Title</label>
                  <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                    {listing.title}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Description</label>
                  <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200 min-h-[80px] leading-relaxed">
                    {listing.description}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Category</label>
                    <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                      {listing.category}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Condition</label>
                    <span className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">
                      {listing.condition}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Price</label>
                  <div className="flex items-center space-x-3">
                    {listing.isFree ? (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-lg font-semibold">Free</span>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">${listing.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                {!listing.isFree && listing.originalPrice && listing.originalPrice > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Original Price</label>
                    <p className="text-gray-500 line-through text-lg">${listing.originalPrice.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Negotiable</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    listing.isNegotiable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.isNegotiable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Delivery */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaMapMarkerAlt className="h-5 w-5 text-green-600 mr-3" />
              Location & Delivery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">City</label>
                  <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                    {listing.city}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Neighborhood</label>
                  <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                    {listing.neighborhood}
                  </p>
                </div>
                {listing.pickupAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Pickup Address</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      {listing.pickupAddress}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Delivery Type</label>
                  <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                    {listing.deliveryOption.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                {listing.deliveryOption === 'shipping' && listing.shippingCost && listing.shippingCost > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Shipping Cost</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      ${listing.shippingCost.toFixed(2)}
                    </p>
                  </div>
                )}
                {listing.pickupInstructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Pickup Instructions</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      {listing.pickupInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {(listing.brand || listing.model || listing.dimensions || listing.weight) && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaInfoCircle className="h-5 w-5 text-purple-600 mr-3" />
                Additional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listing.brand && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Brand</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      {listing.brand}
                    </p>
                  </div>
                )}
                {listing.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Model</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      {listing.model}
                    </p>
                  </div>
                )}
                {listing.dimensions && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Dimensions</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      {listing.dimensions}
                    </p>
                  </div>
                )}
                {listing.weight && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Weight</label>
                    <p className="text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-200">
                      {listing.weight}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaTag className="h-5 w-5 text-orange-600 mr-3" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-3">
                {listing.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaClock className="h-5 w-5 text-indigo-600 mr-3" />
              Status
            </h3>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-3 rounded-lg text-lg font-semibold ${
                listing.status === 'active' ? 'bg-green-100 text-green-800' :
                listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                listing.status === 'expired' ? 'bg-red-100 text-red-800' :
                listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </span>
              <div className="text-sm text-gray-600">
                <p>Created: {new Date(listing.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(listing.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 