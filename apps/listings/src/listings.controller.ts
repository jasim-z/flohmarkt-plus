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
import { CreateListingDto } from '@app/common';
import { JwtAuthGuard } from '@app/common';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  create(@Body() createListingDto: CreateListingDto, @Request() req) {
    return this.listingsService.create(createListingDto, 'temp-seller-id');
  }

  @Get()
  findAll(@Query() query: any) {
    return this.listingsService.findAll(query);
  }

  @Get('nearby')
  findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius = 10,
    @Query() query: any,
  ) {
    return this.listingsService.findNearby(latitude, longitude, radius, query);
  }

  @Get('search')
  search(@Query('q') searchTerm: string, @Query() query: any) {
    return this.listingsService.search(searchTerm, query);
  }

  @Get('categories')
  getCategories() {
    return this.listingsService.getCategories();
  }

  @Get('trending')
  getTrending(@Query('limit') limit = 10) {
    return this.listingsService.getTrending(limit);
  }

  @Get('seller/:sellerId')
  findBySeller(@Param('sellerId') sellerId: string) {
    return this.listingsService.findBySeller(sellerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateListingDto: any,
    @Request() req,
  ) {
    return this.listingsService.update(id, updateListingDto, 'temp-seller-id');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.listingsService.remove(id, 'temp-seller-id');
  }
}
