import {
  Injectable,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '@app/common/types/token-payload';
import { Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Optional() @Inject('IUserService') private readonly usersService?: any,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookies first
        (request: any) => {
          if (request?.cookies?.authentication) {
            return request.cookies.authentication;
          }
          if (request?.cookies?.Authentication) {
            return request.cookies.Authentication;
          }
          return null;
        },
        // Extract from Authorization header as fallback
        (request: any) => {
          return ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        },
        // Legacy support for custom header
        (request: any) => {
          return request?.Authentication || request?.authentication;
        },
      ]),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate({ userId, role, email }: TokenPayload) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    try {
      
      // If user service is available, use it to get full user details
      if (this.usersService) {
        const user = await this.usersService.getUser({
          _id: new Types.ObjectId(userId),
        });
        return user;
      }

      // Otherwise, return a user object with data from the token
      // This is secure because the role comes from the signed JWT token
      const userFromToken = {
        _id: userId,
        userId: userId,
        role: role || 'buyer', // Use role from token
        email: email || 'user@example.com',
        displayName: 'User', // Placeholder
      };
      return userFromToken;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
