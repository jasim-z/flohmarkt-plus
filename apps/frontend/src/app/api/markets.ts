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
  categories: string[];
  status: 'upcoming' | 'ongoing' | 'past';
  registeredVendors: string[];
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

export async function getMarkets(params: GetMarketsParams = {}): Promise<PaginatedMarketsResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.userId) searchParams.append('userId', params.userId);

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