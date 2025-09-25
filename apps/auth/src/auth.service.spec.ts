import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService, TokenPayload } from './auth.service';
import { User } from './users/schemas/user.schema';
import { UserRole } from '@app/common';
import { Types } from 'mongoose';

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
  let jwtService: JwtService;

  // Mock objects
  const mockUser: User = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    displayName: 'Test User',
    role: UserRole.BUYER,
    city: 'Test City',
    neighborhood: 'Test Neighborhood',
    password: 'hashedPassword',
    isActive: true,
    isVerified: false,
    rating: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalReviews: 0,
    badges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResponse = {
    cookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_EXPIRATION') return '3600'; // 1 hour
              return undefined;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should create JWT token and set cookie with correct payload', async () => {
      // Arrange - Set up test data
      const expectedTokenPayload: TokenPayload = {
        userId: mockUser._id.toHexString(),
        role: mockUser.role,
        email: mockUser.email,
      };

      // Act - Call the method we're testing
      const result = await service.login(mockUser, mockResponse);

      // Assert - Verify the results
      // 1. JWT service was called with correct payload
      expect(jwtService.sign).toHaveBeenCalledWith(expectedTokenPayload);

      // 2. Cookie was set with correct parameters
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'authentication',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          domain: 'localhost',
          expires: expect.any(Date),
        })
      );

      // 3. Return value contains expected data
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
          displayName: mockUser.displayName,
          city: mockUser.city,
          neighborhood: mockUser.neighborhood,
        },
      });
    });

    it('should use default role "buyer" when user role is undefined', async () => {
      // Arrange - Create user without role
      const userWithoutRole = { ...mockUser, role: undefined };

      // Act
      await service.login(userWithoutRole, mockResponse);

      // Assert - Check that default role "buyer" was used
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'buyer',
        })
      );
    });
  });

  describe('logout', () => {
    it('should clear authentication cookie', () => {
      // Act
      service.logout(mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'authentication',
        '',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          domain: 'localhost',
          expires: expect.any(Date),
        })
      );
    });
  });

  // ==================== EDGE CASES & ERROR HANDLING ====================

  describe('login - Edge Cases', () => {
    it('should handle user with missing optional fields', async () => {
      // Arrange - User with minimal required data
      const minimalUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        email: 'minimal@example.com',
        role: UserRole.SELLER,
        displayName: 'Minimal User',
        // Missing: city, neighborhood, and other optional fields
        password: 'hashedPassword',
        isActive: true,
        isVerified: false,
        rating: 0,
        totalSales: 0,
        totalPurchases: 0,
        totalReviews: 0,
        badges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = await service.login(minimalUser, mockResponse);

      // Assert - Our improved code now returns empty strings for missing fields
      expect(result.user.city).toBe('');
      expect(result.user.neighborhood).toBe('');
      expect(result.user.role).toBe(UserRole.SELLER);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: minimalUser._id.toHexString(),
          role: UserRole.SELLER,
          email: minimalUser.email,
        })
      );
    });

    it('should handle user with null/undefined role gracefully', async () => {
      // Arrange - User with null role (cast to any to bypass TypeScript)
      const userWithNullRole = {
        ...mockUser,
        role: null as any,
      };

      // Act
      await service.login(userWithNullRole, mockResponse);

      // Assert - Should default to 'buyer'
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'buyer',
        })
      );
    });

    it('should handle user with empty string role', async () => {
      // Arrange - User with empty string role (cast to any to bypass TypeScript)
      const userWithEmptyRole = {
        ...mockUser,
        role: '' as any,
      };

      // Act
      await service.login(userWithEmptyRole, mockResponse);

      // Assert - Should default to 'buyer' (empty string is falsy)
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'buyer',
        })
      );
    });

  });

  describe('login - Input Validation', () => {
    it('should throw BadRequestException when user is null', async () => {
      // Act & Assert
      await expect(service.login(null, mockResponse))
        .rejects
        .toThrow('User data is required');
    });

    it('should throw BadRequestException when user is undefined', async () => {
      // Act & Assert
      await expect(service.login(undefined, mockResponse))
        .rejects
        .toThrow('User data is required');
    });

    it('should throw BadRequestException when user._id is null', async () => {
      // Arrange
      const userWithNullId = { ...mockUser, _id: null };

      // Act & Assert
      await expect(service.login(userWithNullId, mockResponse))
        .rejects
        .toThrow('User ID is required');
    });

    it('should throw BadRequestException when user._id is undefined', async () => {
      // Arrange
      const userWithUndefinedId = { ...mockUser, _id: undefined };

      // Act & Assert
      await expect(service.login(userWithUndefinedId, mockResponse))
        .rejects
        .toThrow('User ID is required');
    });

    it('should throw BadRequestException when user.email is null', async () => {
      // Arrange
      const userWithNullEmail = { ...mockUser, email: null };

      // Act & Assert
      await expect(service.login(userWithNullEmail, mockResponse))
        .rejects
        .toThrow('Valid email is required');
    });

    it('should throw BadRequestException when user.email is undefined', async () => {
      // Arrange
      const userWithUndefinedEmail = { ...mockUser, email: undefined };

      // Act & Assert
      await expect(service.login(userWithUndefinedEmail, mockResponse))
        .rejects
        .toThrow('Valid email is required');
    });

    it('should throw BadRequestException when user.email is empty string', async () => {
      // Arrange
      const userWithEmptyEmail = { ...mockUser, email: '' };

      // Act & Assert
      await expect(service.login(userWithEmptyEmail, mockResponse))
        .rejects
        .toThrow('Valid email is required');
    });

    it('should throw BadRequestException when user.email is whitespace only', async () => {
      // Arrange
      const userWithWhitespaceEmail = { ...mockUser, email: '   ' };

      // Act & Assert
      await expect(service.login(userWithWhitespaceEmail, mockResponse))
        .rejects
        .toThrow('Valid email is required');
    });

    it('should normalize email to lowercase and trim whitespace', async () => {
      // Arrange
      const userWithUppercaseEmail = { ...mockUser, email: '  TEST@EXAMPLE.COM  ' };

      // Act
      const result = await service.login(userWithUppercaseEmail, mockResponse);

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });
  });

  describe('login - Configuration Validation', () => {
    it('should throw InternalServerErrorException when JWT_EXPIRATION is undefined', async () => {
      // Arrange
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithUndefinedConfig = module.get<AuthService>(AuthService);

      // Act & Assert
      await expect(serviceWithUndefinedConfig.login(mockUser, mockResponse))
        .rejects
        .toThrow('JWT_EXPIRATION configuration is missing');
    });

    it('should throw InternalServerErrorException when JWT_EXPIRATION is null', async () => {
      // Arrange
      const mockConfigService = {
        get: jest.fn().mockReturnValue(null),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithNullConfig = module.get<AuthService>(AuthService);

      // Act & Assert
      await expect(serviceWithNullConfig.login(mockUser, mockResponse))
        .rejects
        .toThrow('JWT_EXPIRATION configuration is missing');
    });

    it('should throw InternalServerErrorException when JWT_EXPIRATION is not a number', async () => {
      // Arrange
      const mockConfigService = {
        get: jest.fn().mockReturnValue('invalid-number'),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithInvalidConfig = module.get<AuthService>(AuthService);

      // Act & Assert
      await expect(serviceWithInvalidConfig.login(mockUser, mockResponse))
        .rejects
        .toThrow('JWT_EXPIRATION must be a valid number');
    });

    it('should throw InternalServerErrorException when JWT_EXPIRATION is negative', async () => {
      // Arrange
      const mockConfigService = {
        get: jest.fn().mockReturnValue('-3600'),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithNegativeConfig = module.get<AuthService>(AuthService);

      // Act & Assert
      await expect(serviceWithNegativeConfig.login(mockUser, mockResponse))
        .rejects
        .toThrow('JWT_EXPIRATION cannot be negative');
    });
  });

  describe('login - Error Handling', () => {
    it('should throw error when JWT service fails', async () => {
      // Arrange - Mock JWT service to throw error
      const mockJwtService = {
        sign: jest.fn().mockImplementation(() => {
          throw new Error('JWT signing failed');
        }),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue('3600'),
            },
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
        ],
      }).compile();
      const serviceWithFailingJwt = module.get<AuthService>(AuthService);

      // Act & Assert
      await expect(serviceWithFailingJwt.login(mockUser, mockResponse))
        .rejects
        .toThrow('Authentication failed due to an internal error');
    });

    it('should handle response.cookie throwing error', async () => {
      // Arrange - Mock response to throw error
      const failingResponse = {
        cookie: jest.fn().mockImplementation(() => {
          throw new Error('Cookie setting failed');
        }),
      };

      // Act & Assert - Our improved error handling wraps the error
      await expect(service.login(mockUser, failingResponse))
        .rejects
        .toThrow('Authentication failed due to an internal error');
    });

  });

  describe('logout - Input Validation', () => {
    it('should throw BadRequestException when response is null', () => {
      // Act & Assert
      expect(() => service.logout(null))
        .toThrow('Response object is required for logout');
    });

    it('should throw BadRequestException when response is undefined', () => {
      // Act & Assert
      expect(() => service.logout(undefined))
        .toThrow('Response object is required for logout');
    });

    it('should throw BadRequestException when response.cookie is not a function', () => {
      // Arrange
      const invalidResponse = {
        cookie: 'not-a-function',
      };

      // Act & Assert
      expect(() => service.logout(invalidResponse))
        .toThrow('Invalid response object: cookie method not available');
    });

    it('should throw BadRequestException when response has no cookie method', () => {
      // Arrange
      const invalidResponse = {};

      // Act & Assert
      expect(() => service.logout(invalidResponse))
        .toThrow('Invalid response object: cookie method not available');
    });
  });

  describe('logout - Error Handling', () => {
    it('should throw InternalServerErrorException when response.cookie throws error', () => {
      // Arrange - Mock response to throw error
      const failingResponse = {
        cookie: jest.fn().mockImplementation(() => {
          throw new Error('Cookie clearing failed');
        }),
      };

      // Act & Assert
      expect(() => service.logout(failingResponse))
        .toThrow('Failed to clear authentication cookie');
    });
  });

  describe('login - Boundary Conditions', () => {
    it('should handle very large JWT_EXPIRATION value', async () => {
      // Arrange - Very large expiration time
      const mockConfigService = {
        get: jest.fn().mockReturnValue('999999999'), // Very large number
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithLargeExpiration = module.get<AuthService>(AuthService);

      // Act
      await serviceWithLargeExpiration.login(mockUser, mockResponse);

      // Assert - Should still work
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'authentication',
        'mock-jwt-token',
        expect.objectContaining({
          expires: expect.any(Date),
        })
      );
    });

    it('should handle zero JWT_EXPIRATION value', async () => {
      // Arrange - Zero expiration time
      const mockConfigService = {
        get: jest.fn().mockReturnValue('0'),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithZeroExpiration = module.get<AuthService>(AuthService);

      // Act
      await serviceWithZeroExpiration.login(mockUser, mockResponse);

      // Assert - Should still work, token expires immediately
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'authentication',
        'mock-jwt-token',
        expect.objectContaining({
          expires: expect.any(Date),
        })
      );
    });

    it('should handle zero JWT_EXPIRATION value (allowed boundary)', async () => {
      // Arrange - Zero expiration time (should be allowed)
      const mockConfigService = {
        get: jest.fn().mockReturnValue('0'),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mock-jwt-token'),
            },
          },
        ],
      }).compile();
      const serviceWithZeroExpiration = module.get<AuthService>(AuthService);

      // Act
      await serviceWithZeroExpiration.login(mockUser, mockResponse);

      // Assert - Should work, token expires immediately
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'authentication',
        'mock-jwt-token',
        expect.objectContaining({
          expires: expect.any(Date),
        })
      );
    });
  });
});
