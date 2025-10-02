import { authApiClient, marketsApiClient } from '@/app/lib/apiClient';

export interface LocationResult {
  displayName: string;
  address: string;
  lat: number;
  lon: number;
  placeId: string;
  type: string;
  importance: number;
}

export interface LocationSearchRequest {
  query: string;
  limit?: number;
}

export interface LocationSearchResponse {
  results: LocationResult[];
}

export interface ReverseGeocodeRequest {
  lat: number;
  lon: number;
}

export interface ReverseGeocodeResponse {
  result: LocationResult;
}

export interface LocationUpdateRequest {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface MarketSearchByLocationRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export interface MarketSearchByLocationResponse {
  markets: Array<{
    id: string;
    name: string;
    description: string;
    location: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    categories: string[];
    bannerImage: string;
    additionalImages: string[];
    distance: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchRadius: number;
}

// Location search
export async function searchLocations(request: LocationSearchRequest): Promise<LocationSearchResponse> {
  try {
    const response = await authApiClient.post('/auth/location/search', request);
    return response.data;
  } catch (error) {
    console.error('Location search error:', error);
    throw error;
  }
}

// Reverse geocoding
export async function reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResponse> {
  try {
    const response = await authApiClient.post('/auth/location/reverse-geocode', request);
    return response.data;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

// Update user location
export async function updateUserLocation(location: LocationUpdateRequest): Promise<any> {
  try {
    const response = await authApiClient.put('/auth/location', location);
    return response.data;
  } catch (error) {
    console.error('Update user location error:', error);
    throw error;
  }
}

// Search markets by location
export async function searchMarketsByLocation(request: MarketSearchByLocationRequest): Promise<MarketSearchByLocationResponse> {
  try {
    const response = await marketsApiClient.post('/markets/search-by-location', request);
    return response.data;
  } catch (error) {
    console.error('Search markets by location error:', error);
    throw error;
  }
}
