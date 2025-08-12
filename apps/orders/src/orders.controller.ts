import { Body, Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '@app/common/dto/order/create-order.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@app/common';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer', 'admin')
  async createOrder(
    @Body() request: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder(request, user._id.toString(), user.role);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer', 'seller', 'admin')
  async getOrders(@CurrentUser() user: any) {
    return this.ordersService.getOrders(user._id.toString(), user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer', 'seller', 'admin')
  async getOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrder(id, user._id.toString(), user.role);
  }
}
