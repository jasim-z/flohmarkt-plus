// MongoDB Decimal128 type
export interface MongoDecimal128 {
  $numberDecimal: string;
}

export interface Market {
  _id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdBy: string;
  bannerImage: string;
  vendorLimit?: number;
  boothsAvailable?: number;
  price: string | MongoDecimal128; // Decimal128 from MongoDB, can be string or object
  categories: string[];
  status: 'upcoming' | 'ongoing' | 'past';
  registeredVendors: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetMarketsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  userId?: string; // To filter markets by user participation
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMarketRequest {
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  bannerImage: string;
  vendorLimit?: number;
  boothsAvailable?: number;
  price: number; // Will be converted to Decimal128 in the backend
  categories: string[];
  status?: 'upcoming' | 'ongoing' | 'past';
}

export interface PaginatedMarketsResponse {
  data: Market[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Vendor {
  _id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  city?: string;
  neighborhood?: string;
  rating?: number;
  isVerified?: boolean;
  createdAt: string;
}

export interface GetVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedVendorsResponse {
  data: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JoinMarketRequest {
  marketId: string;
  paymentMethod: 'card';
  cardDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
}

export async function joinMarket(request: JoinMarketRequest): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets/${request.marketId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        paymentMethod: request.paymentMethod,
        cardDetails: request.cardDetails,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to join market');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error joining market:', error);
    throw error;
  }
}

export async function getMarkets(params: GetMarketsParams = {}): Promise<PaginatedMarketsResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch markets');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
}

export async function getMarketsByUser(userId: string): Promise<Market[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets/user/${userId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch markets');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
}

export async function getVendorsByMarket(marketId: string, params: GetVendorsParams = {}): Promise<PaginatedVendorsResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets/${marketId}/vendors?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
}

export async function createMarket(marketData: CreateMarketRequest): Promise<Market> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(marketData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create market');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating market:', error);
    throw error;
  }
}

export async function updateMarket(marketId: string, marketData: Partial<CreateMarketRequest>): Promise<Market> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets/${marketId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(marketData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update market');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating market:', error);
    throw error;
  }
}

export async function deleteMarket(marketId: string): Promise<void> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets/${marketId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete market');
    }
  } catch (error) {
    console.error('Error deleting market:', error);
    throw error;
  }
}

export async function toggleMarketActive(marketId: string): Promise<Market> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953'}/markets/${marketId}/toggle-active`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to toggle market status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error toggling market status:', error);
    throw error;
  }
}

export interface MarketDetailsResponse {
  market: Market;
  vendors: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    totalVendors: number;
    activeVendors: number;
    verifiedVendors: number;
    averageRating: number;
  };
}

export async function getMarketDetails(marketId: string, params: GetVendorsParams = {}): Promise<MarketDetailsResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953';
    const fullUrl = `${apiUrl}/markets/${marketId}/details?${searchParams.toString()}`;
    
    const authToken = localStorage.getItem('auth_token');
    
    console.log('Calling API:', fullUrl);
    console.log('Market ID:', marketId);
    console.log('API URL env var:', process.env.NEXT_PUBLIC_API_URL);
    console.log('Auth Token:', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market details:', error);
    throw error;
  }
} 