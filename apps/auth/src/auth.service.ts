import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
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

  async login(user: User, response: Response) {
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

    response.cookie('Authentication', token, {
      httpOnly: true,
      expires,
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

  logout(response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      expires: new Date(),
    });
  }
}
