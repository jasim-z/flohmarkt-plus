import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument } from '../schemas/listing.schema';
import { ItemCategory, ItemCondition, DeliveryOption } from '@app/common';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  async seedListings() {
    // Clear existing listings
    await this.listingModel.deleteMany({});

    // Get user IDs from the seeded users (these are the actual IDs from the seeding response)
    const sellerIds = [
      '507f1f77bcf86cd799439011', // john.seller@example.com
      '507f1f77bcf86cd799439012', // sarah.fashion@example.com
      '507f1f77bcf86cd799439013', // mike.moving@example.com
      '507f1f77bcf86cd799439014', // alex.gamer@example.com
      '507f1f77bcf86cd799439015', // lisa.bike@example.com
      '507f1f77bcf86cd799439016', // david.books@example.com
      '507f1f77bcf86cd799439017', // anna.furniture@example.com
      '507f1f77bcf86cd799439018', // peter.plants@example.com
    ];

    const listings = [
      {
        title: 'iPhone 13 Pro - Excellent Condition',
        description: 'iPhone 13 Pro in excellent condition. 128GB, Pacific Blue. Comes with original box and charger. No scratches or dents.',
        price: 699,
        isFree: false,
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.EXCELLENT,
        images: ['https://example.com/iphone1.jpg', 'https://example.com/iphone2.jpg'],
        sellerId: new Types.ObjectId(sellerIds[0]), // John Seller
        city: 'Munich',
        neighborhood: 'Schwabing',
        latitude: 48.1550,
        longitude: 11.5878,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        brand: 'Apple',
        model: 'iPhone 13 Pro',
        originalPrice: 999,
        isNegotiable: true,
        pickupAddress: 'Leopoldstraße 123, 80802 München',
        tags: ['smartphone', 'apple', 'iphone', 'electronics'],
      },
      {
        title: 'Vintage Leather Jacket',
        description: 'Beautiful vintage leather jacket from the 80s. Size M, perfect condition. Great for motorcycle rides or casual wear.',
        price: 120,
        isFree: false,
        category: ItemCategory.CLOTHING,
        condition: ItemCondition.GOOD,
        images: ['https://example.com/jacket1.jpg'],
        sellerId: new Types.ObjectId(sellerIds[1]), // Sarah Fashion
        city: 'Munich',
        neighborhood: 'Maxvorstadt',
        latitude: 48.1486,
        longitude: 11.5674,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        brand: 'Unknown',
        isNegotiable: true,
        pickupAddress: 'Amalienstraße 45, 80333 München',
        tags: ['vintage', 'leather', 'jacket', 'fashion'],
      },
      {
        title: 'FREE - Moving Boxes',
        description: 'Free moving boxes in various sizes. Used but in good condition. Perfect for moving or storage.',
        price: 0,
        isFree: true,
        category: ItemCategory.HOME_GARDEN,
        condition: ItemCondition.GOOD,
        images: ['https://example.com/boxes1.jpg'],
        sellerId: new Types.ObjectId(sellerIds[2]), // Mike Moving
        city: 'Munich',
        neighborhood: 'Haidhausen',
        latitude: 48.1333,
        longitude: 11.6000,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        isNegotiable: false,
        pickupAddress: 'Weißenburger Platz 8, 81675 München',
        tags: ['free', 'moving', 'boxes', 'storage'],
      },
      {
        title: 'Gaming PC Setup',
        description: 'Complete gaming PC setup with monitor, keyboard, and mouse. RTX 3070, 16GB RAM, 1TB SSD. Great for gaming and work.',
        price: 1200,
        isFree: false,
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.EXCELLENT,
        images: ['https://example.com/pc1.jpg', 'https://example.com/pc2.jpg'],
        sellerId: new Types.ObjectId(sellerIds[3]), // Alex Gamer
        city: 'Munich',
        neighborhood: 'Sendling',
        latitude: 48.1167,
        longitude: 11.5500,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        brand: 'Custom Build',
        originalPrice: 1800,
        isNegotiable: true,
        pickupAddress: 'Plinganserstraße 67, 81369 München',
        tags: ['gaming', 'pc', 'computer', 'rtx'],
      },
      {
        title: 'Bicycle - City Cruiser',
        description: 'Comfortable city cruiser bicycle. Perfect for daily commute. Includes basket and lights. Recently serviced.',
        price: 180,
        isFree: false,
        category: ItemCategory.SPORTS,
        condition: ItemCondition.GOOD,
        images: ['https://example.com/bike1.jpg'],
        sellerId: new Types.ObjectId(sellerIds[4]), // Lisa Bike
        city: 'Munich',
        neighborhood: 'Bogenhausen',
        latitude: 48.1500,
        longitude: 11.6167,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        brand: 'Trek',
        model: 'City Cruiser',
        isNegotiable: true,
        pickupAddress: 'Prinzregentenstraße 78, 81675 München',
        tags: ['bicycle', 'bike', 'transport', 'city'],
      },
      {
        title: 'Books - Programming Collection',
        description: 'Collection of programming books including JavaScript, Python, and React. All in excellent condition.',
        price: 45,
        isFree: false,
        category: ItemCategory.BOOKS,
        condition: ItemCondition.EXCELLENT,
        images: ['https://example.com/books1.jpg'],
        sellerId: new Types.ObjectId(sellerIds[5]), // David Books
        city: 'Munich',
        neighborhood: 'Ludwigsvorstadt',
        latitude: 48.1333,
        longitude: 11.5667,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        isNegotiable: true,
        pickupAddress: 'Sonnenstraße 25, 80331 München',
        tags: ['books', 'programming', 'javascript', 'python'],
      },
      {
        title: 'Furniture Set - Living Room',
        description: 'Complete living room furniture set: sofa, coffee table, and TV stand. Modern design, excellent condition.',
        price: 350,
        isFree: false,
        category: ItemCategory.HOME_GARDEN,
        condition: ItemCondition.GOOD,
        images: ['https://example.com/furniture1.jpg', 'https://example.com/furniture2.jpg'],
        sellerId: new Types.ObjectId(sellerIds[6]), // Anna Furniture
        city: 'Munich',
        neighborhood: 'Neuhausen',
        latitude: 48.1500,
        longitude: 11.5333,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        brand: 'IKEA',
        isNegotiable: true,
        pickupAddress: 'Nymphenburger Straße 89, 80636 München',
        tags: ['furniture', 'living room', 'sofa', 'ikea'],
      },
      {
        title: 'FREE - Plant Pots',
        description: 'Free ceramic plant pots in various sizes. Perfect for indoor plants. Some have small chips but still usable.',
        price: 0,
        isFree: true,
        category: ItemCategory.HOME_GARDEN,
        condition: ItemCondition.FAIR,
        images: ['https://example.com/pots1.jpg'],
        sellerId: new Types.ObjectId(sellerIds[7]), // Peter Plants
        city: 'Munich',
        neighborhood: 'Au-Haidhausen',
        latitude: 48.1333,
        longitude: 11.6000,
        deliveryOption: DeliveryOption.PICKUP_ONLY,
        isNegotiable: false,
        pickupAddress: 'Kreuzstraße 12, 81675 München',
        tags: ['free', 'plants', 'pots', 'garden'],
      },
    ];

    const createdListings = await this.listingModel.insertMany(listings);
    console.log(`✅ Seeded ${createdListings.length} listings`);
    return createdListings;
  }

  async seedAll() {
    console.log('🌱 Starting database seeding...');
    await this.seedListings();
    console.log('✅ Database seeding completed!');
  }
} 