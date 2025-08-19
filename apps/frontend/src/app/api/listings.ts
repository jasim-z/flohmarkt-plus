export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  category: string;
  condition: string;
  images?: string[];
  sellerId: string;
  marketId?: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  deliveryOption: string;
  shippingCost?: number;
  brand?: string;
  model?: string;
  originalPrice?: number;
  dimensions?: string;
  weight?: string;
  tags: string[];
  isNegotiable: boolean;
  pickupAddress?: string;
  pickupInstructions?: string;
  status: string;
  viewCount: number;
  favoriteCount: number;
  offerCount: number;
  soldAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getListings() {
  try {
    const res = await fetch("http://localhost:3952/listings", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error('Failed to fetch listings');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

export interface GetListingsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  neighborhood?: string;
  isFree?: boolean;
  isNegotiable?: boolean;
  deliveryOption?: string;
}

export async function getAllListings(params: GetListingsParams = {}): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
    const token = localStorage.getItem('auth_token');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.category) queryParams.append('category', params.category);
    if (params.condition) queryParams.append('condition', params.condition);
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.city) queryParams.append('city', params.city);
    if (params.neighborhood) queryParams.append('neighborhood', params.neighborhood);
    if (params.isFree !== undefined) queryParams.append('isFree', params.isFree.toString());
    if (params.isNegotiable !== undefined) queryParams.append('isNegotiable', params.isNegotiable.toString());
    if (params.deliveryOption) queryParams.append('deliveryOption', params.deliveryOption);
    
    const url = `http://localhost:3952/listings?${queryParams.toString()}`;
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch listings');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
}

export async function getListingsBySellerAndMarket(
  sellerId: string, 
  marketId: string, 
  params: GetListingsParams = {}
): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
    const token = localStorage.getItem('auth_token');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `http://localhost:3952/listings/seller/${sellerId}/market/${marketId}?${queryParams.toString()}`;
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch listings');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  category: string;
  condition: string;
  images?: string[];
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  deliveryOption: string;
  shippingCost?: number;
  brand?: string;
  model?: string;
  originalPrice?: number;
  dimensions?: string;
  weight?: string;
  tags: string[];
  isNegotiable: boolean;
  pickupAddress?: string;
  pickupInstructions?: string;
}

export async function createListingForMarket(marketId: string, listingData: CreateListingRequest): Promise<Listing> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`http://localhost:3952/listings/market/${marketId}`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    if (!res.ok) {
      throw new Error('Failed to create listing');
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

export async function updateListing(listingId: string, listingData: Partial<CreateListingRequest>): Promise<Listing> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`http://localhost:3952/listings/${listingId}`, {
      method: "PATCH",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    if (!res.ok) {
      throw new Error('Failed to update listing');
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

// Debug function to check all listings
export async function debugAllListings(): Promise<any[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('http://localhost:3952/listings/debug/all', {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch debug listings');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching debug listings:', error);
    throw error;
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`http://localhost:3952/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Failed to delete listing');
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  totalListings: number;
  listingsWithField: number;
  listingsWithoutField: number;
}> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('http://localhost:3952/listings/migrate/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Failed to check migration status');
    }
    return await res.json();
  } catch (error) {
    console.error('Error checking migration status:', error);
    throw error;
  }
}

export async function runIsDeletedMigration(): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('http://localhost:3952/listings/migrate/add-is-deleted-field', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Failed to run isDeleted migration');
    }
  } catch (error) {
    console.error('Error running isDeleted migration:', error);
    throw error;
  }
}