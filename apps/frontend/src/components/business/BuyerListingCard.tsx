'use client';

import { useState } from "react";
import Image from "next/image";
import { FaMapMarkerAlt, FaUser, FaStore, FaEye, FaBox } from "react-icons/fa";
import { formatPrice } from "@/lib/utils";

interface BuyerListing {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  category: string;
  condition: string;
  images?: string[];
  city: string;
  neighborhood: string;
  deliveryOption: string;
  shippingCost?: number;
  brand?: string;
  model?: string;
  originalPrice?: number;
  isNegotiable: boolean;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  marketId?: string;
  market?: {
    _id: string;
    name: string;
    location: string;
  };
  seller?: {
    _id: string;
    displayName: string;
    email: string;
  };
}

interface BuyerListingCardProps {
  listing: BuyerListing;
  onFavorite?: (listingId: string) => void;
  onView?: (listingId: string) => void;
}

const DEFAULT_IMAGE = '/default-listing.svg';

export default function BuyerListingCard({ listing, onFavorite, onView }: BuyerListingCardProps) {
  const [imgSrc, setImgSrc] = useState(listing.images?.[0] || DEFAULT_IMAGE);
  
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  

  const handleView = () => {
    onView?.(listing._id);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    setImgSrc(DEFAULT_IMAGE);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Determine if we should use Next.js Image optimization
  const shouldOptimizeImage = imgSrc && !imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:');
  const finalImageSrc = imageError ? DEFAULT_IMAGE : imgSrc;

  // Additional fallback for invalid URLs
  const isValidImageUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getImageSrc = () => {
    if (imageError || !finalImageSrc || !isValidImageUrl(finalImageSrc)) {
      return DEFAULT_IMAGE;
    }
    return finalImageSrc;
  };

  // Check if we're showing the default SVG
  const isDefaultImage = getImageSrc() === DEFAULT_IMAGE;

  return (
    <div
      onClick={() => onView?.(listing._id)}
      role="button"
      tabIndex={0}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden group cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Loading State */}
        {imageLoading && !isDefaultImage && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
        
        {shouldOptimizeImage && isValidImageUrl(getImageSrc()) && !isDefaultImage ? (
          <Image
            src={getImageSrc()}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
            onLoad={handleImageLoad}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isDefaultImage ? (
              // Simple, clean default image
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FaBox className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">No Image</p>
                </div>
              </div>
            ) : (
              <img
                src={getImageSrc()}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
          </div>
        )}

        {/* Multiple Images Indicator */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
            {listing.images.length}
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-3 left-3">
          <div className="bg-white px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-lg font-bold text-blue-600">
              {listing.isFree ? 'FREE' : formatPrice(listing.price)}
            </span>
          </div>
        </div>

        {/* Favorite Button removed */}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
          {listing.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
          {listing.description}
        </p>

        {/* Market and Seller Info */}
        <div className="space-y-2">
          {listing.market && (
            <div className="flex items-center text-sm text-gray-600">
              <FaStore className="w-4 h-4 mr-2 text-blue-500" />
              <span className="truncate">{listing.market.name}</span>
            </div>
          )}
          
          {listing.seller && (
            <div className="flex items-center text-sm text-gray-600">
              <FaUser className="w-4 h-4 mr-2 text-green-500" />
              <span className="truncate">{listing.seller.displayName}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-red-400" />
          <span className="text-gray-700">{listing.city}, {listing.neighborhood}</span>
        </div>

        {/* Posted Date */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          {formatDate(listing.createdAt)}
        </div>

        {/* Card is clickable; button removed */}
      </div>
    </div>
  );
} 