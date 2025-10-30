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
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MarketsService } from './markets.service';
import { MarketPriceMigrationService } from './migration/add-price-field';
import { JwtAuthGuard, RolesGuard, Roles } from '@app/common';
import { 
  CreateMarketDto, 
  UpdateMarketDto,
  QueryMarketDto,
  JoinMarketDto,
  BulkCreateMarketDto,
  UpdateRegisteredVendorsDto,
  UploadImageDto,
  FileUploadValidation,
  PresignUploadDto,
  S3ClientService,
  LocationService,
  LocationSearchDto,
  ReverseGeocodeDto,
  MarketSearchByLocationDto,
} from '@app/common';
import { RateLimitMiddleware, RATE_LIMITS } from './middleware/rate-limit.middleware';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';

@Controller('markets')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}))
export class MarketsController {
  constructor(
    private readonly marketsService: MarketsService,
    private readonly marketPriceMigrationService: MarketPriceMigrationService,
    private readonly s3ClientService: S3ClientService,
    private readonly locationService: LocationService,
    @InjectModel('Market') private readonly marketModel: Model<any>,
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
  findAll(@Query() query: QueryMarketDto, @Request() req) {
    // Add user role to query for proper filtering
    query.userRole = req.user.role;
    return this.marketsService.findAll(query);
  }

  @Get('featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  getFeaturedMarkets(@Query('limit') limit?: number) {
    const parsedLimit = limit ? Number(limit) : 4;
    return this.marketsService.getFeaturedMarkets(parsedLimit);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  findByUser(@Param('userId') userId: string) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.marketsService.findByUser(userId);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  seed() {
    return this.marketsService.seed();
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createBulk(@Body() body: BulkCreateMarketDto, @Request() req) {
    return this.marketsService.createBulk(body.markets, req.user);
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
    // Validate ObjectId formats
    if (!/^[0-9a-fA-F]{24}$/.test(marketId)) {
      throw new BadRequestException('Invalid market ID format');
    }
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.marketsService.addUserToMarket(marketId, userId);
  }

  @Post(':marketId/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  async joinMarket(
    @Param('marketId') marketId: string,
    @Request() req: any,
    @Body() body: JoinMarketDto
  ) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(marketId)) {
      throw new BadRequestException('Invalid market ID format');
    }
    return this.marketsService.joinMarket(marketId, req.user.userId, body);
  }

  @Delete(':marketId/leave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  async leaveMarket(@Param('marketId') marketId: string, @Request() req) {
    return this.marketsService.leaveMarket(marketId, req.user.userId);
  }

  @Put(':marketId/registered-vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateRegisteredVendors(
    @Param('marketId') marketId: string,
    @Body() body: UpdateRegisteredVendorsDto
  ) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(marketId)) {
      throw new BadRequestException('Invalid market ID format');
    }
    return this.marketsService.updateRegisteredVendors(marketId, body.userIds);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  findOne(@Param('id') id: string) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid market ID format');
    }
    return this.marketsService.findOne(id);
  }

  @Get(':id/vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  getVendorsByMarket(@Param('id') id: string, @Query() query: QueryMarketDto) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid market ID format');
    }
    return this.marketsService.getVendorsByMarket(id, query);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  getMarketDetails(@Param('id') id: string, @Query() query: QueryMarketDto) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid market ID format');
    }
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
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid market ID format');
    }
    return this.marketsService.update(id, updateMarketDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid market ID format');
    }
    return this.marketsService.remove(id, req.user);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  toggleActive(@Param('id') id: string, @Request() req) {
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('Invalid market ID format');
    }
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

  @Post('presign-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async presignUpload(
    @Body() presignData: PresignUploadDto,
    @Request() req
  ) {
    const { fileName, contentType, uploadType, marketId } = presignData;
    const userId = req.user.userId;

    console.log('Presign upload request:', { fileName, contentType, uploadType, marketId, userId });

    // Validate file type and size
    const errorMessage = FileUploadValidation.getErrorMessage(contentType, 0);
    if (errorMessage) {
      throw new BadRequestException(errorMessage);
    }

    // Generate unique key based on upload type
    let key: string;
    let usedMarketId: string;
    
    if (uploadType === 'market_banner') {
      // For banner uploads, we might not have marketId yet (during creation)
      usedMarketId = marketId || `temp_${userId}_${Date.now()}`;
      key = this.s3ClientService.generateMarketImageKey(usedMarketId, userId, fileName, 'banner');
    } else if (uploadType === 'market_additional') {
      // For additional images, use marketId if provided, otherwise use temporary ID
      usedMarketId = marketId || `temp_${userId}_${Date.now()}`;
      key = this.s3ClientService.generateMarketImageKey(usedMarketId, userId, fileName, 'additional');
    } else {
      throw new BadRequestException(`Invalid upload type: ${uploadType}. Must be 'market_banner' or 'market_additional'.`);
    }

    // Generate presigned URL
    const presignedUrl = await this.s3ClientService.getPresignedUploadUrl(key, contentType);
    
    // Get public URL for the uploaded file
    const publicUrl = this.s3ClientService.getPublicUrl(key);

    return {
      success: true,
      presignedUrl,
      key,
      publicUrl,
      marketId: usedMarketId, // The market ID that was used (temporary or real)
      expiresIn: 3600, // 1 hour
    };
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: any,
    @Body() uploadData: UploadImageDto
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type and size
    const errorMessage = FileUploadValidation.getErrorMessage(file.mimetype, file.size);
    if (errorMessage) {
      throw new BadRequestException(errorMessage);
    }

    // In a real implementation, you would upload to a cloud storage service
    // For now, we'll return a mock response
    return {
      success: true,
      message: 'Image uploaded successfully',
      file: {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        name: uploadData.name || file.originalname,
        category: uploadData.category || 'market',
        url: `https://example.com/uploads/${file.filename}` // Mock URL
      }
    };
  }

  @Post('location/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  async searchLocations(@Body() searchDto: LocationSearchDto) {
    const result = await this.locationService.searchLocations(searchDto.query, searchDto.limit);
    
    if (!result.success) {
      throw new BadRequestException(result.error || 'Location search failed');
    }

    return {
      results: result.results.map(location => ({
        displayName: location.displayName,
        address: this.locationService.formatAddress(location),
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        placeId: location.placeId,
        type: location.type,
        importance: location.importance,
      })),
    };
  }

  @Post('location/reverse-geocode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  async reverseGeocode(@Body() reverseGeocodeDto: ReverseGeocodeDto) {
    const result = await this.locationService.reverseGeocode(reverseGeocodeDto.lat, reverseGeocodeDto.lon);
    
    if (!result.success) {
      throw new BadRequestException(result.error || 'Reverse geocoding failed');
    }

    if (!result.result) {
      throw new BadRequestException('No location found for the given coordinates');
    }

    return {
      result: {
        displayName: result.result.displayName,
        address: this.locationService.formatAddress(result.result),
        lat: parseFloat(result.result.lat),
        lon: parseFloat(result.result.lon),
        placeId: result.result.placeId,
        type: result.result.type,
        importance: result.result.importance,
      },
    };
  }

  @Post('search-by-location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller', 'buyer')
  async searchMarketsByLocation(@Body() searchDto: MarketSearchByLocationDto) {
    // Directly query markets with coordinates, bypassing findAll filters
    const marketsWithLocation = await this.marketModel.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      isDeleted: { $ne: true },
      isActive: true
    }).exec();
    
    const nearbyMarkets = this.locationService.findMarketsWithinRadius(
      searchDto.latitude,
      searchDto.longitude,
      marketsWithLocation,
      searchDto.radiusKm
    );

    // Apply pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedMarkets = nearbyMarkets.slice(startIndex, endIndex);
    const totalPages = Math.ceil(nearbyMarkets.length / limit);

    return {
      markets: paginatedMarkets.map(item => ({
        ...item.market.toObject(),
        distance: Math.round(item.distance * 100) / 100, // Round to 2 decimal places
      })),
      pagination: {
        page,
        limit,
        total: nearbyMarkets.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      searchRadius: searchDto.radiusKm,
    };
  }

} 