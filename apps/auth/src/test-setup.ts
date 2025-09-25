// Integration test setup file
import * as mongoose from 'mongoose';

beforeAll(async () => {
  // Set test environment variables
  // Use Docker MongoDB or local MongoDB instance
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-integration-test';
  process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
  process.env.JWT_EXPIRATION = '3600';
  process.env.RABBIT_MQ_URI = 'amqp://localhost:5672';
  process.env.RABBIT_MQ_AUTH_QUEUE = 'auth_queue';
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
});
