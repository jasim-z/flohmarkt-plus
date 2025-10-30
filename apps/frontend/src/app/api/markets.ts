import { marketsApiClient } from '@/app/lib/apiClient';
import { apiErrorHandler } from '@/app/lib/apiErrorHandler';

// MongoDB Decimal128 type
export interface MongoDecimal128 {
  $numberDecimal: string;
}

export interface Market {
  _id: string;
  name: string;
  description: string;
  location: string;
  date: string; // start date
  endDate?: string; // new: end date
  startTime: string;
  endTime: string;
  isActive: boolean;
  isFeatured?: boolean;
  createdBy: string;
  bannerImage: string;
  additionalImages?: string[];
  vendorLimit?: number;
  boothsAvailable?: number;
  price: string | MongoDecimal128; // Decimal128 from MongoDB, can be string or object
  categories: string[];
  status: 'upcoming' | 'ongoing' | 'past';
  registeredVendors: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  distance?: number; // Distance in km when location-based search is used
}

export interface GetMarketsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  userId?: string; // To filter markets by user participation
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isFeatured?: string;
}

export interface CreateMarketRequest {
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
  isActive: boolean;
  bannerImage?: string;
  additionalImages?: string[];
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
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  city?: string;
  neighborhood?: string;
  rating?: number;
  totalReviews?: number;
  totalSales?: number;
  isVerified?: boolean;
  badges?: string[];
  createdAt: string;
  updatedAt: string;
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
    const response = await marketsApiClient.post(`/markets/${request.marketId}/join`, {
      paymentMethod: request.paymentMethod,
      cardDetails: request.cardDetails,
    });
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getMarkets(params: GetMarketsParams = {}): Promise<PaginatedMarketsResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.category) searchParams.append('category', params.category);
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const url = `/markets?${searchParams.toString()}`;
    const response = await marketsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getFeaturedMarkets(limit: number = 4): Promise<PaginatedMarketsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());
    const url = `/markets/featured?${searchParams.toString()}`;
    const response = await marketsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getMarketsByUser(userId: string): Promise<Market[]> {
  try {
    const response = await marketsApiClient.get(`/markets/user/${userId}`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
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

    const url = `/markets/${marketId}/vendors?${searchParams.toString()}`;
    const response = await marketsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function createMarket(marketData: CreateMarketRequest): Promise<Market> {
  try {
    const response = await marketsApiClient.post('/markets', marketData);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function updateMarket(marketId: string, marketData: Partial<CreateMarketRequest>): Promise<Market> {
  try {
    const response = await marketsApiClient.patch(`/markets/${marketId}`, marketData);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function deleteMarket(marketId: string): Promise<void> {
  try {
    await marketsApiClient.delete(`/markets/${marketId}`);
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function toggleMarketActive(marketId: string): Promise<Market> {
  try {
    const response = await marketsApiClient.patch(`/markets/${marketId}/toggle-active`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
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
    
    const url = `/markets/${marketId}/details?${searchParams.toString()}`;
    const response = await marketsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export interface PresignUploadRequest {
  fileName: string;
  contentType: string;
  uploadType: 'market_banner' | 'market_additional';
  marketId?: string;
}

export interface PresignUploadResponse {
  success: boolean;
  presignedUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export async function presignUpload(request: PresignUploadRequest): Promise<PresignUploadResponse> {
  try {
    const response = await marketsApiClient.post('/markets/presign-upload', request);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
} 

export async function leaveMarket(marketId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await marketsApiClient.delete(`/markets/${marketId}/leave`, { skipAuthRedirect: true } as any);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
} 