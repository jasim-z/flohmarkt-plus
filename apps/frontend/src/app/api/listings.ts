import { listingsApiClient } from '@/app/lib/apiClient';
import { apiErrorHandler } from '@/app/lib/apiErrorHandler';

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
    const response = await listingsApiClient.get('/listings');
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    console.error('Error fetching listings:', apiError);
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

export async function getListingsByMarket(marketId: string, params: GetListingsParams = {}): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
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
    
    const url = `/listings/market/${marketId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await listingsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    console.error('Error fetching listings by market:', apiError);
    return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
}

export async function getAllListings(params: GetListingsParams = {}): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
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
    
    const url = `/listings?${queryParams.toString()}`;
    const response = await listingsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getListingsBySellerAndMarket(
  sellerId: string, 
  marketId: string, 
  params: GetListingsParams = {}
): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `/listings/seller/${sellerId}/market/${marketId}?${queryParams.toString()}`;
    const response = await listingsApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getListingById(listingId: string): Promise<Listing> {
  try {
    const response = await listingsApiClient.get(`/listings/${listingId}`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
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
    const response = await listingsApiClient.post(`/listings/market/${marketId}`, listingData);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function updateListing(listingId: string, listingData: Partial<CreateListingRequest>): Promise<Listing> {
  try {
    const response = await listingsApiClient.patch(`/listings/${listingId}`, listingData);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

// Debug function to check all listings
export async function debugAllListings(): Promise<any[]> {
  try {
    const response = await listingsApiClient.get('/listings/debug/all');
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  try {
    await listingsApiClient.delete(`/listings/${listingId}`);
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  totalListings: number;
  listingsWithField: number;
  listingsWithoutField: number;
}> {
  try {
    const response = await listingsApiClient.get('/listings/migrate/status');
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function runIsDeletedMigration(): Promise<void> {
  try {
    await listingsApiClient.post('/listings/migrate/add-is-deleted-field');
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function presignListingUpload(fileName: string, contentType: string): Promise<{ success: boolean; presignedUrl: string; publicUrl: string; key: string; expiresIn: number }> {
  try {
    const response = await listingsApiClient.post('/listings/presign-upload', {
      fileName,
      contentType,
    });
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}