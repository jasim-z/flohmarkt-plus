import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UserRole } from '@app/common';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
