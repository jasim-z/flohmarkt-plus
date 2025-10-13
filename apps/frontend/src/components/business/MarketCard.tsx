'use client';

import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaStore } from 'react-icons/fa';
import { Market } from '@/app/api/markets';

interface MarketCardProps {
  market: Market;
  variant?: 'featured' | 'compact';
  onClick?: () => void;
}

const MarketCard: React.FC<MarketCardProps> = ({ market, variant = 'compact', onClick }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Reset error state when market image changes
    setImgError(false);
  }, [market.bannerImage]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const end = endDate || startDate;
    return `${formatDate(startDate)} - ${formatDate(end)}`;
  };

  const getMarketStatus = (market: Market) => {
    const now = new Date();
    const marketDate = new Date(market.date);
    const marketStart = new Date(`${market.date}T${market.startTime}`);
    const marketEnd = new Date(`${market.date}T${market.endTime}`);
    
    // Check if the market date is today
    const isToday = now.toDateString() === marketDate.toDateString();
    
    if (isToday) {
      // If it's today, check the time
      if (now < marketStart) {
        return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800', icon: FaClock };
      } else if (now >= marketStart && now <= marketEnd) {
        return { status: 'Live Now', color: 'bg-green-100 text-green-800', icon: FaStore };
      } else {
        return { status: 'Ended', color: 'bg-gray-100 text-gray-800', icon: FaClock };
      }
    } else if (now < marketDate) {
      // Future date
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800', icon: FaClock };
    } else {
      // Past date
      return { status: 'Ended', color: 'bg-gray-100 text-gray-800', icon: FaClock };
    }
  };

  const status = getMarketStatus(market);
  const StatusIcon = status.icon;

  if (variant === 'featured') {
    return (
      <div 
        onClick={onClick}
        role="button"
        tabIndex={0}
        data-testid="market-card"
        className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer market-card ring-1 ring-amber-100"
      >
        {/* Banner Image */}
        <div className="relative h-32 bg-gradient-to-br from-amber-50 to-amber-100">
          {market.bannerImage && !imgError ? (
            <img
              src={market.bannerImage}
              alt={market.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaStore data-testid="market-icon" className="w-12 h-12 text-amber-400" />
            </div>
          )}
          
          {/* Featured Badge */}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Featured
          </div>
          {/* Status Badge */}
          <div data-testid="market-status" className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${status.color} status-badge`}>
            <StatusIcon className="inline w-3 h-3 mr-1" />
            {status.status}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 text-sm">
            {market.name}
          </h3>
          
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center">
              <FaMapMarkerAlt className="w-3 h-3 mr-1 text-red-500" />
              <span className="truncate">{market.location}</span>
              {market.distance && (
                <span className="ml-2 text-blue-600 font-medium">
                  {market.distance.toFixed(1)} km
                </span>
              )}
            </div>
            
            <div className="flex items-center">
              <FaCalendar className="w-3 h-3 mr-1 text-blue-500" />
              <span>{formatDateRange(market.date, market.endDate)}</span>
            </div>
            
            <div className="flex items-center">
              <FaClock className="w-3 h-3 mr-1 text-green-500" />
              <span>{market.startTime} - {market.endTime}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-testid="market-card"
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer market-card"
    >
      {/* Banner Image */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
        {market.bannerImage && !imgError ? (
          <img
            src={market.bannerImage}
            alt={market.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaStore data-testid="market-icon" className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div data-testid="market-status" className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${status.color} status-badge`}>
          <StatusIcon className="inline w-3 h-3 mr-1" />
          {status.status}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
          {market.name}
        </h3>
        
        <div className="space-y-2 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <FaMapMarkerAlt className="w-3 h-3 mr-1 text-red-500" />
            <span className="truncate">{market.location}</span>
            {market.distance && (
              <span className="ml-2 text-blue-600 font-medium">
                {market.distance.toFixed(1)} km
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            <FaCalendar className="w-3 h-3 mr-1 text-blue-500" />
            <span>{formatDateRange(market.date, market.endDate)}</span>
          </div>
          
          <div className="flex items-center">
            <FaClock className="w-3 h-3 mr-1 text-green-500" />
            <span>{market.startTime} - {market.endTime}</span>
          </div>
          
          <div className="flex items-center">
            <FaUsers className="w-3 h-3 mr-1 text-purple-500" />
            <span>{market.registeredVendors.length} vendors</span>
          </div>
        </div>
        
        {/* Categories */}
        {market.categories.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {market.categories.slice(0, 1).map((category, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {category}
                </span>
              ))}
              {market.categories.length > 1 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{market.categories.length - 1}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketCard; 