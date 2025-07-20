import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { CreateUserDto } from '@app/common';
import { UsersService } from './users.service';

@Controller('auth/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body(ValidationPipe) request: CreateUserDto) {
    return this.usersService.createUser(request);
  }
}
