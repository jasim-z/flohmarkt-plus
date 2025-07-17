import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserRequest } from './dto/create-user.request';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(request: CreateUserRequest) {
    try {
      console.log('🚀 ~ AuthService ~ User ~ createUser:');

      const userResp = await this.validateCreateUserRequest(request);
      console.log('🚀 ~ UsersService ~ createUser ~ userResp:', userResp);
      const user = await this.usersRepository.create({
        ...request,
        password: await bcrypt.hash(request.password, 10),
      });

      console.log('🚀 ~ AuthService ~ User ~ createUser: user', user);

      return user;
    } catch (error) {
      console.log('🚀 ~ UsersService ~ createUser ~ error:', error);
    }
  }

  private async validateCreateUserRequest(request: CreateUserRequest) {
    let user: User;
    try {
      user = await this.usersRepository.findOne({
        email: request.email,
      });
    } catch (err) {
      throw new UnprocessableEntityException('Error validateCreateUserRequest');
    }
    if (user) {
      throw new UnprocessableEntityException('Email already exists.');
    }
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({ email });
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    return user;
  }

  async getUser(getUserArgs: Partial<User>) {
    return this.usersRepository.findOne(getUserArgs);
  }
}
