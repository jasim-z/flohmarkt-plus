import {
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  Get,
  Put,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard, S3ClientService, UpdateUserDto, LocationService, LocationSearchDto, LocationUpdateDto, ReverseGeocodeDto } from '@app/common';
import { UsersService } from './users/users.service';
import { Types } from 'mongoose';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly s3ClientService: S3ClientService,
    private readonly locationService: LocationService,
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
  async getMe(@Request() req) {
    // Get full user data including avatar
    const user = await this.usersService.getUser({ _id: req.user._id });
      return {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        displayName: user.displayName,
        avatar: user.avatar,
        city: user.city,
        neighborhood: user.neighborhood,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
        rating: user.rating,
        isActive: user.isActive,
      };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateData: UpdateUserDto) {
    const userId = req.user._id;
    return this.usersService.updateUserProfile(userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/presign-upload')
  async presignProfileUpload(@Request() req) {
    const userId = req.user._id;
    const fileName = `profile-${userId}-${Date.now()}.jpg`;
    const key = this.s3ClientService.generateUserAvatarKey(userId, fileName);
    
    const presignedUrl = await this.s3ClientService.getPresignedUploadUrl(key, 'image/jpeg');
    const publicUrl = this.s3ClientService.getPublicUrl(key);

    return {
      success: true,
      presignedUrl,
      key,
      publicUrl,
      expiresIn: 3600,
    };
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
        name: user.name,
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

  @UseGuards(JwtAuthGuard)
  @Post('location/search')
  async searchLocations(@Body() searchDto: LocationSearchDto) {
    const result = await this.locationService.searchLocations(searchDto.query, searchDto.limit);
    
    if (!result.success) {
      throw new BadRequestException(result.error || 'Location search failed');
    }

    return {
      results: result.results.map(location => ({
        displayName: location.displayName,
        address: this.locationService.formatAddress(location),
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        placeId: location.placeId,
        type: location.type,
        importance: location.importance,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('location/reverse-geocode')
  async reverseGeocode(@Body() reverseGeocodeDto: ReverseGeocodeDto) {
    const result = await this.locationService.reverseGeocode(reverseGeocodeDto.lat, reverseGeocodeDto.lon);
    
    if (!result.success) {
      throw new BadRequestException(result.error || 'Reverse geocoding failed');
    }

    if (!result.result) {
      throw new BadRequestException('No location found for the given coordinates');
    }

    return {
      result: {
        displayName: result.result.displayName,
        address: this.locationService.formatAddress(result.result),
        lat: parseFloat(result.result.lat),
        lon: parseFloat(result.result.lon),
        placeId: result.result.placeId,
        type: result.result.type,
        importance: result.result.importance,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('location')
  async updateLocation(@Request() req, @Body() locationDto: LocationUpdateDto) {
    const userId = req.user._id;
    
    // Update user location
    const updatedUser = await this.usersService.updateUserProfile(userId, locationDto);
    
    return {
      success: true,
      user: {
        _id: updatedUser._id,
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        city: updatedUser.city,
        neighborhood: updatedUser.neighborhood,
        postalCode: updatedUser.postalCode,
        address: updatedUser.address,
        country: updatedUser.country,
        state: updatedUser.state,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
      },
    };
  }

  @Get('verify-email/:token')
  async verifyEmail(@Request() req) {
    const token = req.params.token;
    const result = await this.usersService.verifyEmail(token);
    
    return result;
  }
}
