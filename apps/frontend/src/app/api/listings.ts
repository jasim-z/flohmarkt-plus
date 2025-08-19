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

export async function getListingsBySellerAndMarket(sellerId: string, marketId: string): Promise<Listing[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`http://localhost:3952/listings/seller/${sellerId}/market/${marketId}`, {
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
    return [];
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
    return [];
  }
}