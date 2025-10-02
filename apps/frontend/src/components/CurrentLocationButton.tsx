'use client';

import React, { useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { reverseGeocode, LocationResult } from '../app/api/location';

// LocationResult is now imported from the API

interface CurrentLocationButtonProps {
  onLocationDetected: (location: LocationResult) => void;
  className?: string;
  disabled?: boolean;
}

export default function CurrentLocationButton({ 
  onLocationDetected, 
  className = "",
  disabled = false 
}: CurrentLocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode the coordinates
      const data = await reverseGeocode({
        lat: latitude,
        lon: longitude,
      });
      
      if (data.result) {
        onLocationDetected(data.result);
      } else {
        throw new Error('No location details found');
      }
    } catch (err) {
      let errorMessage = 'Failed to get current location';
      
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={getCurrentLocation}
        disabled={disabled || isLoading}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        <span>
          {isLoading ? 'Getting location...' : 'Use current location'}
        </span>
      </button>

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
