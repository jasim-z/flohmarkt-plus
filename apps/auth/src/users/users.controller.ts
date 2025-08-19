import { Body, Controller, Post, Get, Query, ValidationPipe, UseGuards, Param } from '@nestjs/common';
import { CreateUserDto, GetUsersDto, PaginatedUsersResponse, GetUsersByIdsRequest, GetUsersResponse } from '@app/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body(ValidationPipe) request: CreateUserDto) {
    return this.usersService.createUser(request);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUsers(@Query() query: GetUsersDto): Promise<PaginatedUsersResponse> {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post('batch')
  async getUsersByIds(@Body() request: GetUsersByIdsRequest): Promise<GetUsersResponse> {
    return this.usersService.getUsersByIds(request);
  }
}
