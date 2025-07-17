import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderRequest } from './dto/create-order.request';
import { JwtAuthGuard } from '@app/common';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() request: CreateOrderRequest) {
    return this.ordersService.createOrder(request);
  }

  // @Get()
  // async getOrder() {
  //   return this.ordersService.getOrder();
  // }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getOrders() {
    return this.ordersService.getOrders();
  }
}
