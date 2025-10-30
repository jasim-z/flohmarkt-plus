'use client';

import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import LocationSearch from './LocationSearch';
import CurrentLocationButton from './CurrentLocationButton';
import { LocationResult } from '../app/api/location';

// LocationResult is now imported from the API

interface LocationPickerProps {
  onLocationChange: (location: LocationResult | null) => void;
  initialLocation?: LocationResult | null;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showCurrentLocation?: boolean;
  label?: string;
  required?: boolean;
}

export default function LocationPicker({
  onLocationChange,
  initialLocation = null,
  placeholder = "Search for a location...",
  className = "",
  disabled = false,
  showCurrentLocation = true,
  label = "Location",
  required = false,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(initialLocation);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    onLocationChange(location);
  };

  const handleCurrentLocationDetected = (location: LocationResult) => {
    setSelectedLocation(location);
    onLocationChange(location);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    onLocationChange(null);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {/* Location Search */}
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          placeholder={placeholder}
          disabled={disabled}
        />

        {/* Current Location Button */}
        {showCurrentLocation && (
          <CurrentLocationButton
            onLocationDetected={handleCurrentLocationDetected}
            disabled={disabled}
          />
        )}

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">
                  {selectedLocation.address}
                </p>
                <p className="text-xs text-green-700 truncate">
                  {selectedLocation.displayName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                </p>
              </div>
            </div>
            <button
              onClick={clearLocation}
              disabled={disabled}
              className="ml-2 p-1 text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
