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
import { MarketPriceMigrationService } from './migration/add-price-field';
import { JwtAuthGuard, RolesGuard, Roles } from '@app/common';
import { CreateMarketDto, UpdateMarketDto } from '@app/common';

@Controller('markets')
export class MarketsController {
  constructor(
    private readonly marketsService: MarketsService,
    private readonly marketPriceMigrationService: MarketPriceMigrationService,
  ) {}

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

  @Post('update-statuses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatuses() {
    return this.marketsService.updateMarketStatuses();
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }

  @Get(':id/vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  getVendorsByMarket(@Param('id') id: string, @Query() query: any) {
    return this.marketsService.getVendorsByMarket(id, query);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  getMarketDetails(@Param('id') id: string, @Query() query: any) {
    return this.marketsService.getMarketDetails(id, query);
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

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.marketsService.toggleActive(id, req.user);
  }

  @Post('migrate/add-is-deleted-field')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addIsDeletedFieldToExistingMarkets() {
    // This would call the migration service
    // For now, we'll implement it directly in the service
    return this.marketsService.addIsDeletedFieldToExistingMarkets();
  }

  @Post('migrate/add-is-active-field')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addIsActiveFieldToExistingMarkets() {
    // This would call the migration service
    // For now, we'll implement it directly in the service
    return this.marketsService.addIsActiveFieldToExistingMarkets();
  }

  @Post('migrate/add-price-field')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addPriceFieldToExistingMarkets() {
    return this.marketPriceMigrationService.addPriceFieldToExistingMarkets();
  }

  @Post('migrate/update-price-to-decimal128')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updatePriceFieldToDecimal128() {
    return this.marketPriceMigrationService.updatePriceFieldToDecimal128();
  }
} 