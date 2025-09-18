import { Injectable } from '@nestjs/common';
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

  async login(user: User, response: any) {
    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
      role: user.role || 'buyer', // Include user role in token
      email: user.email,
    };

    const expires = new Date();
    expires.setSeconds(
      expires.getSeconds() + this.configService.get('JWT_EXPIRATION'),
    );

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
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        city: user.city,
        neighborhood: user.neighborhood,
      },
    };
  }

  logout(response: any) {
    response.cookie('authentication', '', {
      httpOnly: true,
      expires: new Date(),
      sameSite: 'lax',
      secure: false, // Set to true in production with HTTPS
      domain: 'localhost', // Allow cookies to be shared across localhost ports
    });
  }
}
