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

  async validate({ userId, role, email }: TokenPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    // Return user object with data from the JWT token
    // This is secure because the data comes from the signed JWT token
    return {
      _id: userId,
      userId: userId,
      role: role || 'buyer', // Use role from token
      email: email || 'user@example.com',
      displayName: 'User', // Placeholder
    };
  }
}
