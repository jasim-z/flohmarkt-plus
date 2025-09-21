import { Body, Controller, Post, Get, Query, ValidationPipe, UseGuards, Param, UsePipes, BadRequestException } from '@nestjs/common';
import { CreateUserDto, GetUsersDto, PaginatedUsersResponse, GetUsersByIdsRequest, GetUsersResponse } from '@app/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common';

@Controller('users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: true } }))
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
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid user id');
    }
    return this.usersService.getUserById(id);
  }

  @Get(':id/public')
  @UseGuards(JwtAuthGuard)
  async getPublicUserInfo(@Param('id') id: string) {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid user id');
    }
    return this.usersService.getPublicUserInfo(id);
  }

  @Post('batch')
  async getUsersByIds(@Body() request: GetUsersByIdsRequest): Promise<GetUsersResponse> {
    if (!request || !Array.isArray((request as any).userIds)) {
      throw new BadRequestException('userIds array is required');
    }
    const invalid = (request as any).userIds.filter((id: string) => !/^[0-9a-fA-F]{24}$/.test(id));
    if (invalid.length) {
      throw new BadRequestException(`Invalid userIds: ${invalid.join(',')}`);
    }
    return this.usersService.getUsersByIds(request);
  }
}
