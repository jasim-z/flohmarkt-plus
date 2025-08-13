import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { MarketsService } from './markets.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@app/common';
import { CreateMarketDto, UpdateMarketDto } from '@app/common';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() createMarketDto: CreateMarketDto, @Request() req) {
    return this.marketsService.create(createMarketDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  findAll(@Query() query: any) {
    return this.marketsService.findAll(query);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  findByUser(@Param('userId') userId: string) {
    return this.marketsService.findByUser(userId);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  seed() {
    return this.marketsService.seed();
  }

  @Post(':marketId/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  addUserToMarket(
    @Param('marketId') marketId: string,
    @Param('userId') userId: string
  ) {
    return this.marketsService.addUserToMarket(marketId, userId);
  }

  @Put(':marketId/registered-vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateRegisteredVendors(
    @Param('marketId') marketId: string,
    @Body() body: { userIds: string[] }
  ) {
    return this.marketsService.updateRegisteredVendors(marketId, body.userIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }

  @Get(':id/vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  getVendorsByMarket(@Param('id') id: string, @Query() query: any) {
    return this.marketsService.getVendorsByMarket(id, query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateMarketDto: UpdateMarketDto,
    @Request() req,
  ) {
    return this.marketsService.update(id, updateMarketDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.marketsService.remove(id, req.user);
  }
} 