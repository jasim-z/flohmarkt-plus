import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '@app/common/types/token-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          const token = request?.Authentication;
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate({ userId }: TokenPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    // Return a minimal user object with the ID
    // In a real app, you might want to fetch user details from a shared service
    return {
      _id: userId,
      userId: userId,
      role: 'buyer', // Default role - in real app, get from user service
      email: 'user@example.com', // Placeholder
      firstName: 'User',
      lastName: 'Name',
    };
  }
} 