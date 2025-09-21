import {
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  Get,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard } from '@app/common';
import { UsersService } from './users/users.service';
import { Types } from 'mongoose';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response: any) {
    return this.authService.login(req.user, response);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: any) {
    this.authService.logout(response);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }

  @MessagePattern('get_user')
  async getUser(@Payload() data: { userId: string }) {
    try {
      const user = await this.usersService.getUser({
        _id: new Types.ObjectId(data.userId),
      });

      if (!user) {
        return null;
      }

      // Return user details without sensitive information
      return {
        _id: user._id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        city: user.city,
        neighborhood: user.neighborhood,
        isVerified: user.isVerified,
        rating: user.rating,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
}
