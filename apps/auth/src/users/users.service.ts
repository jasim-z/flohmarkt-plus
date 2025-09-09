import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UserRole, GetUsersDto, PaginatedUsersResponse, GetUsersByIdsRequest, GetUsersResponse } from '@app/common';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(request: CreateUserDto) {
    try {
      await this.validateCreateUserRequest(request);

      const user = await this.usersRepository.create({
        ...request,
        password: await bcrypt.hash(request.password, 10),
        role: request.role || UserRole.BUYER, // Default to buyer
        isActive: true,
        memberSince: new Date(),
      });

      return user;
    } catch (error) {
      console.log('🚀 ~ UsersService ~ createUser ~ error:', error);
      throw error;
    }
  }

  private async validateCreateUserRequest(request: CreateUserDto) {
    let user: User;
    try {
      user = await this.usersRepository.findOne({
        email: request.email,
      });
    } catch (err) {
      throw new UnprocessableEntityException('Error validateCreateUserRequest');
    }
    if (user) {
      throw new UnprocessableEntityException('Email already exists.');
    }
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    return user;
  }

  async getUser(getUserArgs: Partial<User>) {
    return this.usersRepository.findOne(getUserArgs);
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findOne({ _id: userId });
    if (!user) {
      throw new UnprocessableEntityException('User not found');
    }
    return user;
  }

  async getPublicUserInfo(userId: string) {
    const user = await this.usersRepository.findOne({ _id: userId });
    if (!user) {
      throw new UnprocessableEntityException('User not found');
    }
    
    // Return only public information
    return {
      _id: user._id,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      city: user.city,
      neighborhood: user.neighborhood,
      isVerified: user.isVerified,
      rating: user.rating,
      totalSales: user.totalSales,
      totalReviews: user.totalReviews,
      badges: user.badges,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUsers(query: GetUsersDto): Promise<PaginatedUsersResponse> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', role, isActive } = query;
    
    // Build filter object
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Get total count
    const total = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated results
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const users = await this.userModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .select({
        _id: 1,
        email: 1,
        displayName: 1,
        role: 1,
        isActive: 1,
        city: 1,
        neighborhood: 1,
        avatar: 1,
        rating: 1,
        totalSales: 1,
        totalReviews: 1,
        isVerified: 1,
        badges: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean()
      .exec();

    // Transform the data to match the expected interface
    const transformedUsers = users.map((user: any) => ({
      _id: user._id?.toString() || '',
      email: user.email || '',
      displayName: user.displayName || '',
      role: user.role || '',
      isActive: user.isActive ?? false,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return {
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async updateUserProfile(userId: string, updateData: Partial<User>) {
    return this.usersRepository.findOneAndUpdate(
      { _id: userId },
      { ...updateData, lastSeen: new Date() },
    );
  }

  async getUsersByRole(role: UserRole) {
    return this.usersRepository.find({ role, isActive: true });
  }

  async getNearbyUsers(latitude: number, longitude: number, radiusKm = 10) {
    // This would use geospatial queries when we add location indexes
    return this.usersRepository.find({
      isActive: true,
      // Add geospatial query here when needed
    });
  }

  async getUsersByIds(request: GetUsersByIdsRequest): Promise<GetUsersResponse> {
    const { userIds, query } = request;
    const { page = 1, limit = 20, search, sortBy = 'displayName', sortOrder = 'asc', role, isActive } = query;
    
    // Ensure page and limit are integers
    const pageNum = parseInt(page.toString(), 10) || 1;
    const limitNum = parseInt(limit.toString(), 10) || 20;
    
    // Build filter object
    const filter: any = {
      _id: { $in: userIds },
    };
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const users = await this.userModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .select({
        _id: 1,
        email: 1,
        displayName: 1,
        role: 1,
        isActive: 1,
        city: 1,
        neighborhood: 1,
        avatar: 1,
        rating: 1,
        totalSales: 1,
        totalReviews: 1,
        isVerified: 1,
        badges: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean()
      .exec();

    // Transform the data to match the expected interface
    const transformedUsers = users.map((user: any) => ({
      _id: user._id?.toString() || '',
      email: user.email || '',
      displayName: user.displayName || '',
      role: user.role || '',
      isActive: user.isActive ?? false,
      city: user.city || '',
      neighborhood: user.neighborhood || '',
      avatar: user.avatar || '',
      rating: user.rating || 0,
      totalSales: user.totalSales || 0,
      totalReviews: user.totalReviews || 0,
      isVerified: user.isVerified || false,
      badges: user.badges || [],
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return {
      data: transformedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }
}
