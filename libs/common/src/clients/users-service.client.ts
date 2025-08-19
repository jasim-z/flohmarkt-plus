import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export interface GetUsersByIdsRequest {
  userIds: string[];
  query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    role?: string;
    isActive?: boolean;
  };
}

export interface GetUsersResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UsersServiceClient {
  getUsersByIds(request: GetUsersByIdsRequest): Promise<GetUsersResponse>;
}

@Injectable()
export class HttpUsersServiceClient implements UsersServiceClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getUsersByIds(request: GetUsersByIdsRequest): Promise<GetUsersResponse> {
    try {
      const usersServiceUrl = this.configService.get<string>('USERS_SERVICE_URL');
      if (!usersServiceUrl) {
        throw new Error('USERS_SERVICE_URL environment variable is not configured');
      }

      const response = await firstValueFrom(
        this.httpService.post<GetUsersResponse>(`${usersServiceUrl}/users/batch`, request)
      );
      return response.data;
    } catch (error) {
      // Handle service communication errors
      throw new Error(`Failed to fetch users from users service: ${error.message}`);
    }
  }
} 