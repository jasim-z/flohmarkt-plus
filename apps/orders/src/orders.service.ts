import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderRequest } from './dto/create-order.request';
import { OrdersRepository } from './orders.repository';
import { BILLING_SERVICE } from './constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Types } from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(BILLING_SERVICE) private billingClient: ClientProxy,
  ) {}

  async createOrder(request: CreateOrderRequest, userId: string) {
    const session = await this.ordersRepository.startTransaction();
    try {
      // TODO: Get listing details to extract sellerId
      // For now, we'll use a placeholder - in a real app, you'd fetch the listing
      const sellerId = '507f1f77bcf86cd799439011'; // Placeholder seller ID

      const orderData = {
        ...request,
        buyerId: new Types.ObjectId(userId),
        sellerId: new Types.ObjectId(sellerId),
        listingId: new Types.ObjectId(request.listingId),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const order = await this.ordersRepository.create(orderData, { session });
      await lastValueFrom(
        this.billingClient.emit('order_created', {
          request: orderData,
        }),
      );
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  async getOrder(orderId: string, userId: string, userRole: string) {
    const query: any = { _id: orderId };

    // Buyers can only see their own orders
    if (userRole === 'buyer') {
      query.buyerId = new Types.ObjectId(userId);
    }
    // Sellers can only see orders for their listings
    else if (userRole === 'seller') {
      query.sellerId = new Types.ObjectId(userId);
    }
    // Admins can see all orders

    const order = await this.ordersRepository.findOne(query);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getOrders(userId: string, userRole: string) {
    const query: any = {};

    // Buyers can only see their own orders
    if (userRole === 'buyer') {
      query.buyerId = new Types.ObjectId(userId);
    }
    // Sellers can only see orders for their listings
    else if (userRole === 'seller') {
      query.sellerId = new Types.ObjectId(userId);
    }
    // Admins can see all orders

    return this.ordersRepository.find(query);
  }
}
