<<<<<<< Updated upstream
import { Injectable, UnauthorizedException } from '@nestjs/common';
=======
import { Injectable, UnauthorizedException, Inject, Optional } from '@nestjs/common';
>>>>>>> Stashed changes
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Types } from 'mongoose';
import { TokenPayload } from '@app/common/types/token-payload';
<<<<<<< Updated upstream
import { UsersService } from 'apps/auth/src/users/users.service';
=======

>>>>>>> Stashed changes
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
<<<<<<< Updated upstream
    private readonly usersService: UsersService,
=======
    @Optional() @Inject('IUserService') private readonly usersService?: any,
>>>>>>> Stashed changes
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

  async validate({ userId }: TokenPayload) {
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

      // Otherwise, return a minimal user object with the ID
      return {
        _id: userId,
        userId: userId,
        role: 'buyer', // Default role - in real app, get from user service
        email: 'user@example.com', // Placeholder
        firstName: 'User',
        lastName: 'Name',
      };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
