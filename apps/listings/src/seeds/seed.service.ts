import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Listing, ListingDocument } from '../schemas/listing.schema';
import { ItemCategory, ItemCondition, DeliveryOption } from '@app/common';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async seedListings() {
    // Clear existing listings
    await this.listingModel.deleteMany({});

    // Fetch sellers from users collection (role: 'seller')
    const usersColl = this.connection.collection('users');
    const sellers = await usersColl
      .find({ role: 'seller', isActive: { $ne: false } })
      .project({ _id: 1 })
      .toArray();

    if (!sellers || sellers.length === 0) {
      throw new Error('No sellers found. Please seed users first.');
    }

    const sellerIds = sellers.map(u => new Types.ObjectId(u._id));

    // Fetch markets to associate listings to; ensure markets are upcoming
    const marketsColl = this.connection.collection('markets');
    const markets = await marketsColl.find({}).project({ _id: 1, registeredVendors: 1, vendorLimit: 1 }).toArray();
    if (!markets || markets.length === 0) {
      throw new Error('No markets found. Please seed markets first.');
    }

    const listings = [
      {
        title: 'iPhone 13 Pro - Excellent Condition',
        description: 'iPhone 13 Pro in excellent condition. 128GB, Pacific Blue. Comes with original box and charger. No scratches or dents.',
        price: 699,
        isFree: false,
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.EXCELLENT,
        images: ['https://example.com/iphone1.jpg', 'https://example.com/iphone2.jpg'],
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

    // Assign sellers and markets
    const prepared = [] as any[];
    for (let i = 0; i < listings.length; i++) {
      const listing = { ...listings[i] } as any;
      const sellerId = sellerIds[i % sellerIds.length];
      listing.sellerId = sellerId;

      // Find a market where this seller is registered
      let market = markets.find(m => Array.isArray(m.registeredVendors) && m.registeredVendors.some((v: any) => v.toString() === sellerId.toString()));

      // If none, add seller to a random market (respect vendorLimit if present)
      if (!market) {
        const candidate = markets[Math.floor(Math.random() * markets.length)];
        await marketsColl.updateOne(
          { _id: candidate._id },
          { $addToSet: { registeredVendors: sellerId } }
        );
        market = candidate;
      }

      listing.marketId = market._id as Types.ObjectId;
      prepared.push(listing);
    }

    const createdListings = await this.listingModel.insertMany(prepared);
    console.log(`✅ Seeded ${createdListings.length} listings`);
    return createdListings;
  }

  async seedAll() {
    console.log('🌱 Starting database seeding...');
    await this.seedListings();
    console.log('✅ Database seeding completed!');
  }
} 