import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from './users/schemas/user.schema';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates user data before processing login
   */
  private validateUserForLogin(user: User): void {
    if (!user) {
      throw new BadRequestException('User data is required');
    }

    if (!user._id) {
      throw new BadRequestException('User ID is required');
    }

    if (!user.email || typeof user.email !== 'string' || user.email.trim().length === 0) {
      throw new BadRequestException('Valid email is required');
    }
  }

  /**
   * Validates JWT configuration
   */
  private validateJwtConfig(): number {
    const expiration = this.configService.get('JWT_EXPIRATION');
    
    if (expiration === undefined || expiration === null) {
      throw new InternalServerErrorException('JWT_EXPIRATION configuration is missing');
    }

    const expirationNumber = parseInt(expiration, 10);
    
    if (isNaN(expirationNumber)) {
      throw new InternalServerErrorException('JWT_EXPIRATION must be a valid number');
    }

    if (expirationNumber < 0) {
      throw new InternalServerErrorException('JWT_EXPIRATION cannot be negative');
    }

    return expirationNumber;
  }

  async login(user: User, response: any) {
    try {
      // Validate input data
      this.validateUserForLogin(user);
      
      // Validate configuration
      const expirationSeconds = this.validateJwtConfig();

      // Create token payload
      const tokenPayload: TokenPayload = {
        userId: user._id.toHexString(),
        role: user.role || 'buyer', // Include user role in token
        email: user.email.trim().toLowerCase(), // Normalize email
      };

      // Calculate expiration date
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + expirationSeconds);

      // Sign JWT token
      const token = this.jwtService.sign(tokenPayload);

      // Set cookie with proper configuration for cross-origin requests
      response.cookie('authentication', token, {
        httpOnly: true,
        expires,
        sameSite: 'lax',
        secure: false, // Set to true in production with HTTPS
        domain: 'localhost', // Allow cookies to be shared across localhost ports
      });

      return {
        access_token: token,
        user: {
          id: user._id,
          email: user.email.trim().toLowerCase(),
          role: user.role || 'buyer',
          name: user.name || '',
          displayName: user.displayName || '',
          avatar: user.avatar || '',
          city: user.city || '',
          neighborhood: user.neighborhood || '',
        },
      };
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Wrap unexpected errors
      throw new InternalServerErrorException('Authentication failed due to an internal error');
    }
  }

  logout(response: any) {
    if (!response) {
      throw new BadRequestException('Response object is required for logout');
    }

    if (typeof response.cookie !== 'function') {
      throw new BadRequestException('Invalid response object: cookie method not available');
    }

    try {
      response.cookie('authentication', '', {
        httpOnly: true,
        expires: new Date(),
        sameSite: 'lax',
        secure: false, // Set to true in production with HTTPS
        domain: 'localhost', // Allow cookies to be shared across localhost ports
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to clear authentication cookie');
    }
  }
}
