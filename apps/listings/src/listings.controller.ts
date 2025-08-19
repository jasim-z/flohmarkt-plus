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
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingMarketIdMigrationService } from './migration/add-market-id-field';
import { ListingIsDeletedMigrationService } from './migration/add-is-deleted-field';
import { JwtAuthGuard, RolesGuard, Roles } from '@app/common';
import { CreateListingDto } from '@app/common/dto/listing/create-listing.dto';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly listingMarketIdMigrationService: ListingMarketIdMigrationService,
    private readonly listingIsDeletedMigrationService: ListingIsDeletedMigrationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  create(@Body() createListingDto: CreateListingDto, @Request() req) {
    return this.listingsService.create(createListingDto, req.user.userId);
  }

  @Post('market/:marketId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  createForMarket(
    @Param('marketId') marketId: string,
    @Body() createListingDto: CreateListingDto, 
    @Request() req
  ) {
    // Add marketId to the listing data
    const listingData = {
      ...createListingDto,
      marketId: marketId
    };
    return this.listingsService.create(listingData, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  findAll(@Query() query: any) {
    return this.listingsService.findAll(query);
  }

  @Get('nearby')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius = 10,
    @Query() query: any,
  ) {
    return this.listingsService.findNearby(latitude, longitude, radius, query);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  search(@Query('q') searchTerm: string, @Query() query: any) {
    return this.listingsService.search(searchTerm, query);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  getCategories() {
    return this.listingsService.getCategories();
  }

  @Get('trending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  getTrending(@Query('limit') limit = 10) {
    return this.listingsService.getTrending(limit);
  }

  @Post('migrate/add-market-id-field')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addMarketIdFieldToExistingListings() {
    return this.listingMarketIdMigrationService.addMarketIdFieldToExistingListings();
  }

  @Post('migrate/add-is-deleted-field')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addIsDeletedFieldToExistingListings() {
    return this.listingIsDeletedMigrationService.addIsDeletedFieldToExistingListings();
  }

  @Post('migrate/update-deleted-listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateDeletedListings() {
    return this.listingIsDeletedMigrationService.updateDeletedListings();
  }

  @Get('migrate/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async checkMigrationStatus() {
    return this.listingIsDeletedMigrationService.checkMigrationStatus();
  }

  @Get('debug/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async debugAllListings() {
    return this.listingsService.debugAllListings();
  }

  @Get('seller/:sellerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  findBySeller(@Param('sellerId') sellerId: string) {
    return this.listingsService.findBySeller(sellerId);
  }

  @Get('seller/:sellerId/market/:marketId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  findBySellerAndMarket(
    @Param('sellerId') sellerId: string,
    @Param('marketId') marketId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    console.log('Controller received search params:', { page, limit, search, sortBy, sortOrder });
    console.log('Search term:', search, 'Type:', typeof search);
    
    return this.listingsService.findBySellerAndMarket(
      sellerId, 
      marketId, 
      Number(page), 
      Number(limit), 
      search, 
      sortBy, 
      sortOrder
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  update(
    @Param('id') id: string,
    @Body() updateListingDto: any,
    @Request() req,
  ) {
    return this.listingsService.update(id, updateListingDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  remove(@Param('id') id: string, @Request() req) {
    return this.listingsService.remove(id, req.user.userId);
  }
}
