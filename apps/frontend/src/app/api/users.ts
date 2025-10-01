export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  isVerified?: boolean;
  rating?: number;
  totalSales?: number;
  totalPurchases?: number;
  totalReviews?: number;
  badges?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

import { usersApiClient } from '@/app/lib/apiClient';
import { apiErrorHandler } from '@/app/lib/apiErrorHandler';

export interface PaginatedUsersResponse {
  data: User[];
  pagination: PaginationMeta;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  isActive?: boolean;
}

export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedUsersResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.role) searchParams.append('role', params.role);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const url = `/users?${searchParams.toString()}`;
    const response = await usersApiClient.get(url);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function getUserById(userId: string): Promise<User> {
  try {
    const response = await usersApiClient.get(`/users/${userId}/public`);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export interface UpdateUserProfileRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
}

export interface PresignUploadResponse {
  success: boolean;
  presignedUrl: string;
  key: string;
  downloadUrl: string;
  expiresIn: number;
}

export async function updateUserProfile(updateData: UpdateUserProfileRequest): Promise<User> {
  try {
    const response = await usersApiClient.put('/auth/profile', updateData);
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
}

export async function presignProfileUpload(): Promise<PresignUploadResponse> {
  try {
    const response = await usersApiClient.post('/auth/profile/presign-upload', undefined, {
      skipAuthRedirect: true // Don't auto-redirect on auth errors
    });
    return response.data;
  } catch (error) {
    const apiError = apiErrorHandler.handleError(error);
    throw apiError;
  }
} 