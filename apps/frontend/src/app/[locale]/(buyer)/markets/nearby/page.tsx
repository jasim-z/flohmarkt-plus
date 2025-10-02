'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FaMapMarkerAlt, FaSearch, FaLocationArrow, FaClock, FaUsers } from 'react-icons/fa';
import LocationPicker from '@/components/LocationPicker';
import { LocationResult, searchMarketsByLocation, MarketSearchByLocationResponse } from '@/app/api/location';
import { useUser } from '@/contexts/UserContext';

export default function NearbyMarkets() {
  const t = useTranslations();
  const { user } = useUser();
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [markets, setMarkets] = useState<MarketSearchByLocationResponse['markets']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);

  // Auto-detect user location if available
  useEffect(() => {
    if (user?.latitude && user?.longitude && !selectedLocation) {
      setSelectedLocation({
        displayName: `${user.city || 'Unknown'}, ${user.country || 'Unknown'}`,
        address: user.address || `${user.city || 'Unknown'}, ${user.country || 'Unknown'}`,
        lat: user.latitude,
        lon: user.longitude,
        placeId: 'user-location',
        type: 'user',
        importance: 1,
      });
    }
  }, [user, selectedLocation]);

  const handleLocationChange = (location: LocationResult | null) => {
    setSelectedLocation(location);
    if (location) {
      searchNearbyMarkets(location);
    } else {
      setMarkets([]);
    }
  };

  const searchNearbyMarkets = async (location: LocationResult) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchMarketsByLocation({
        latitude: location.lat,
        longitude: location.lon,
        radiusKm: searchRadius,
      });

      setMarkets(response.markets);
    } catch (err: any) {
      setError(err.message || 'Failed to search nearby markets');
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Markets Near You
          </h1>
          <p className="text-gray-600">
            Discover flea markets and events in your area
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <FaMapMarkerAlt className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Search Location</h2>
          </div>

          <div className="space-y-4">
            <LocationPicker
              onLocationChange={handleLocationChange}
              placeholder="Search for a location..."
              showCurrentLocation={true}
            />

            {selectedLocation && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <FaLocationArrow className="h-4 w-4 mr-2" />
                  <span>Search radius: {searchRadius} km</span>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Radius:</label>
                  <select
                    value={searchRadius}
                    onChange={(e) => {
                      setSearchRadius(Number(e.target.value));
                      if (selectedLocation) {
                        searchNearbyMarkets(selectedLocation);
                      }
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Searching nearby markets...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && markets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Found {markets.length} market{markets.length !== 1 ? 's' : ''} nearby
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <div key={market.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {market.bannerImage && (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={market.bannerImage}
                        alt={market.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {market.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {market.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                        <span>{market.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="h-4 w-4 mr-2" />
                        <span>{formatDate(market.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">🕐</span>
                        <span>{formatTime(market.startTime)} - {formatTime(market.endTime)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="h-4 w-4 mr-2" />
                        <span>{market.categories.join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-green-600">
                        €{market.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {market.distance.toFixed(1)} km away
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && selectedLocation && markets.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <FaSearch className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              No markets found nearby
            </h3>
            <p className="text-yellow-700">
              Try expanding your search radius or searching in a different location.
            </p>
          </div>
        )}

        {!selectedLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <FaMapMarkerAlt className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Select a location to find nearby markets
            </h3>
            <p className="text-blue-700">
              Use the search above or click "Use current location" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
