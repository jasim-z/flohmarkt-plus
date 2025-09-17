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
} from '@nestjs/common';
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
  getFeaturedMarkets() {
    return this.marketsService.getFeaturedMarkets();
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

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
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
} 