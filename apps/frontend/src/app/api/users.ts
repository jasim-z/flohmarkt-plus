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

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3950'}/users?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getUserById(userId: string): Promise<User> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3950'}/users/${userId}/public`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
} 