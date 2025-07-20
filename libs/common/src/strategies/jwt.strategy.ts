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
      return {
        _id: userId,
        userId: userId,
        role: role || 'buyer', // Use role from token
        email: email || 'user@example.com',
        displayName: 'User', // Placeholder
      };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
