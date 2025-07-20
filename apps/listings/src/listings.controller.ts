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
import { JwtAuthGuard, RolesGuard, Roles } from '@app/common';
import { CreateListingDto } from '@app/common/dto/listing/create-listing.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  create(@Body() createListingDto: CreateListingDto, @Request() req) {
    return this.listingsService.create(createListingDto, 'temp-seller-id');
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

  @Get('seller/:sellerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'buyer', 'admin')
  findBySeller(@Param('sellerId') sellerId: string) {
    return this.listingsService.findBySeller(sellerId);
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
    return this.listingsService.update(id, updateListingDto, 'temp-seller-id');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  remove(@Param('id') id: string, @Request() req) {
    return this.listingsService.remove(id, 'temp-seller-id');
  }
}
