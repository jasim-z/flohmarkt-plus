import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UserRole, GetUsersDto, PaginatedUsersResponse } from '@app/common';
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
      .lean()
      .exec();

    return {
      data: users,
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
}
