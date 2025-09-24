export * from './database/abstract.repository';
export * from './database/abstract.schema';
export * from './database/database.module';
export * from './rmq/rmq.module';
export * from './rmq/rmq.service';
export * from './guards/jwt-auth.guard';
export * from './guards/local-auth.guard';
export * from './guards/roles.guard';
export * from './strategies/jwt.strategy';
export * from './strategies/local.strategy';

export * from './types/token-payload';

// Decorators
export * from './decorators/current-user.decorator';
export * from './decorators/roles.decorator';

// Flea Market App DTOs
export * from './dto/user/create-user.request';
export * from './dto/user/create-user.dto';
export * from './dto/user/get-users.dto';
export * from './dto/user/paginated-users.response';
export * from './dto/market/create-market.dto';
export * from './dto/market/update-market.dto';
export * from './dto/market/query-market.dto';
export * from './dto/market/join-market.dto';
export * from './dto/market/bulk-create-market.dto';
export * from './dto/market/update-vendors.dto';
export * from './dto/market/upload-image.dto';
export * from './dto/listing/create-listing.dto';

// Service Clients
export * from './clients/users-service.client';

// Observability
export * from './middleware/correlation.middleware';
export * from './interceptors/logging.interceptor';
export * from './metrics/metrics.service';
export * from './metrics/metrics.middleware';
export * from './health/health.controller';