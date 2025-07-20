import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { UserRole } from '@app/common';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedUsers() {
    // Clear existing users
    await this.userModel.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'john.seller@example.com',
        password: hashedPassword,
        displayName: 'John Seller',
        bio: 'Tech enthusiast selling electronics and gadgets',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Schwabing',
        latitude: 48.1550,
        longitude: 11.5878,
        phoneNumber: '+49 89 12345678',
        isVerified: true,
        rating: 4.8,
        totalSales: 15,
        totalPurchases: 3,
        totalReviews: 12,
        badges: ['Top Seller', 'Verified'],
      },
      {
        email: 'sarah.fashion@example.com',
        password: hashedPassword,
        displayName: 'Sarah Fashion',
        bio: 'Fashion lover with great vintage finds',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Maxvorstadt',
        latitude: 48.1486,
        longitude: 11.5674,
        phoneNumber: '+49 89 87654321',
        isVerified: true,
        rating: 4.6,
        totalSales: 8,
        totalPurchases: 5,
        totalReviews: 8,
        badges: ['Fashion Expert'],
      },
      {
        email: 'mike.moving@example.com',
        password: hashedPassword,
        displayName: 'Mike Moving',
        bio: 'Moving to a new city, giving away lots of stuff',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Haidhausen',
        latitude: 48.1333,
        longitude: 11.6000,
        phoneNumber: '+49 89 11223344',
        isVerified: false,
        rating: 4.2,
        totalSales: 3,
        totalPurchases: 1,
        totalReviews: 3,
        badges: ['New Seller'],
      },
      {
        email: 'alex.gamer@example.com',
        password: hashedPassword,
        displayName: 'Alex Gamer',
        bio: 'Gaming setup specialist and tech reviewer',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Sendling',
        latitude: 48.1167,
        longitude: 11.5500,
        phoneNumber: '+49 89 55667788',
        isVerified: true,
        rating: 4.9,
        totalSales: 22,
        totalPurchases: 7,
        totalReviews: 18,
        badges: ['Tech Expert', 'Top Seller'],
      },
      {
        email: 'lisa.bike@example.com',
        password: hashedPassword,
        displayName: 'Lisa Bike',
        bio: 'Cycling enthusiast and outdoor gear seller',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Bogenhausen',
        latitude: 48.1500,
        longitude: 11.6167,
        phoneNumber: '+49 89 99887766',
        isVerified: true,
        rating: 4.7,
        totalSales: 12,
        totalPurchases: 4,
        totalReviews: 10,
        badges: ['Sports Expert'],
      },
      {
        email: 'david.books@example.com',
        password: hashedPassword,
        displayName: 'David Books',
        bio: 'Book collector and programming instructor',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Ludwigsvorstadt',
        latitude: 48.1333,
        longitude: 11.5667,
        phoneNumber: '+49 89 33445566',
        isVerified: true,
        rating: 4.5,
        totalSales: 6,
        totalPurchases: 2,
        totalReviews: 6,
        badges: ['Book Expert'],
      },
      {
        email: 'anna.furniture@example.com',
        password: hashedPassword,
        displayName: 'Anna Furniture',
        bio: 'Interior design enthusiast with great furniture finds',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Neuhausen',
        latitude: 48.1500,
        longitude: 11.5333,
        phoneNumber: '+49 89 77889900',
        isVerified: true,
        rating: 4.4,
        totalSales: 9,
        totalPurchases: 3,
        totalReviews: 8,
        badges: ['Home Expert'],
      },
      {
        email: 'peter.plants@example.com',
        password: hashedPassword,
        displayName: 'Peter Plants',
        bio: 'Plant lover and garden enthusiast',
        role: UserRole.SELLER,
        city: 'Munich',
        neighborhood: 'Au-Haidhausen',
        latitude: 48.1333,
        longitude: 11.6000,
        phoneNumber: '+49 89 11223344',
        isVerified: false,
        rating: 4.1,
        totalSales: 2,
        totalPurchases: 1,
        totalReviews: 2,
        badges: ['New Seller'],
      },
      {
        email: 'maria.buyer@example.com',
        password: hashedPassword,
        displayName: 'Maria Buyer',
        bio: 'Looking for great deals on electronics and fashion',
        role: UserRole.BUYER,
        city: 'Munich',
        neighborhood: 'Schwabing',
        latitude: 48.1550,
        longitude: 11.5878,
        phoneNumber: '+49 89 12345678',
        isVerified: true,
        rating: 4.8,
        totalSales: 0,
        totalPurchases: 12,
        totalReviews: 8,
        badges: ['Top Buyer'],
      },
      {
        email: 'tom.buyer@example.com',
        password: hashedPassword,
        displayName: 'Tom Buyer',
        bio: 'Student looking for affordable furniture and books',
        role: UserRole.BUYER,
        city: 'Munich',
        neighborhood: 'Maxvorstadt',
        latitude: 48.1486,
        longitude: 11.5674,
        phoneNumber: '+49 89 87654321',
        isVerified: false,
        rating: 4.3,
        totalSales: 0,
        totalPurchases: 5,
        totalReviews: 3,
        badges: ['Student'],
      },
      {
        email: 'admin@fleamarket.com',
        password: hashedPassword,
        displayName: 'Admin User',
        bio: 'Platform administrator',
        role: UserRole.ADMIN,
        city: 'Munich',
        neighborhood: 'City Center',
        latitude: 48.1351,
        longitude: 11.5820,
        phoneNumber: '+49 89 00000000',
        isVerified: true,
        rating: 5.0,
        totalSales: 0,
        totalPurchases: 0,
        totalReviews: 0,
        badges: ['Admin'],
      },
    ];

    const createdUsers = await this.userModel.insertMany(users);
    console.log(`✅ Seeded ${createdUsers.length} users`);
    return createdUsers;
  }

  async seedAll() {
    console.log('🌱 Starting user seeding...');
    const users = await this.seedUsers();
    console.log('✅ User seeding completed!');
    return users;
  }
} 