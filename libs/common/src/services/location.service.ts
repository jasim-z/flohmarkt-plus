import { Injectable, Logger } from '@nestjs/common';

export interface LocationResult {
  displayName: string;
  address: {
    houseNumber?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
  };
  lat: string;
  lon: string;
  placeId: string;
  type: string;
  importance: number;
}

export interface GeocodeResult {
  success: boolean;
  results: LocationResult[];
  error?: string;
}

export interface ReverseGeocodeResult {
  success: boolean;
  result?: LocationResult;
  error?: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Search for locations by query (address, postal code, etc.)
   */
  async searchLocations(query: string, limit: number = 10): Promise<GeocodeResult> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: limit.toString(),
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        countrycodes: 'de,at,ch', // Focus on German-speaking countries
        dedupe: '1',
      });

      const url = `${this.nominatimBaseUrl}/search?${params}`;
      
      this.logger.log(`Searching locations for query: ${query}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Flohmarkt-Plus/1.0 (contact@flohmarkt-plus.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }

      const results: LocationResult[] = await response.json();
      
      this.logger.log(`Found ${results.length} locations for query: ${query}`);
      
      return {
        success: true,
        results: results.map(this.normalizeLocationResult),
      };
    } catch (error) {
      this.logger.error(`Error searching locations for query: ${query}`, error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        format: 'json',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
      });

      const url = `${this.nominatimBaseUrl}/reverse?${params}`;
      
      this.logger.log(`Reverse geocoding coordinates: ${lat}, ${lon}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Flohmarkt-Plus/1.0 (contact@flohmarkt-plus.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }

      const result: LocationResult = await response.json();
      
      this.logger.log(`Reverse geocoded coordinates: ${lat}, ${lon}`);
      
      return {
        success: true,
        result: this.normalizeLocationResult(result),
      };
    } catch (error) {
      this.logger.error(`Error reverse geocoding coordinates: ${lat}, ${lon}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find markets within a certain radius of user location
   */
  findMarketsWithinRadius(
    userLat: number,
    userLon: number,
    markets: Array<{ latitude?: number; longitude?: number }>,
    radiusKm: number = 50
  ): Array<{ market: any; distance: number }> {
    return markets
      .filter(market => market.latitude && market.longitude)
      .map(market => ({
        market,
        distance: this.calculateDistance(
          userLat,
          userLon,
          market.latitude!,
          market.longitude!
        ),
      }))
      .filter(item => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Normalize location result from Nominatim
   */
  private normalizeLocationResult(result: any): LocationResult {
    return {
      displayName: result.display_name,
      address: {
        houseNumber: result.address?.house_number,
        road: result.address?.road,
        neighbourhood: result.address?.neighbourhood,
        suburb: result.address?.suburb,
        city: result.address?.city || result.address?.town || result.address?.village,
        state: result.address?.state,
        postcode: result.address?.postcode,
        country: result.address?.country,
        countryCode: result.address?.country_code,
      },
      lat: result.lat,
      lon: result.lon,
      placeId: result.place_id,
      type: result.type,
      importance: result.importance,
    };
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format address from location result
   */
  formatAddress(location: LocationResult): string {
    const { address } = location;
    const parts = [];

    if (address.houseNumber && address.road) {
      parts.push(`${address.road} ${address.houseNumber}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    if (address.postcode && address.city) {
      parts.push(`${address.postcode} ${address.city}`);
    } else if (address.city) {
      parts.push(address.city);
    }

    if (address.state) {
      parts.push(address.state);
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(', ');
  }

  /**
   * Get coordinates from location result
   */
  getCoordinates(location: LocationResult): { lat: number; lon: number } {
    return {
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
    };
  }
}
