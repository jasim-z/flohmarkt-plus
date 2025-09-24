import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnprocessableEntityException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UserRole } from '@app/common';
import { User } from './schemas/user.schema';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
  compare: jest.fn(),
}));

describe('UsersService (unit)', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let userModel: jest.Mocked<Model<User>>;

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
    } as any;

    userModel = {
      countDocuments: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('creates a user with hashed password and default role', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null); // no existing user
      (usersRepository.create as jest.Mock).mockResolvedValueOnce({
        _id: 'u1',
        email: 'a@b.com',
        role: UserRole.BUYER,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_pw');

      const dto: CreateUserDto = {
        email: 'a@b.com',
        password: 'secret',
        displayName: 'Alice',
        role: undefined as any,
      } as any;

      const created = await service.createUser(dto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({ email: 'a@b.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'a@b.com',
          password: 'hashed_pw',
          role: UserRole.BUYER,
          isActive: true,
        }),
      );
      expect(created).toEqual(expect.objectContaining({ _id: 'u1' }));
    });

    it('throws if email already exists', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ _id: 'existing' });
      const dto = { email: 'a@b.com', password: 'x' } as any;
      await expect(service.createUser(dto)).rejects.toThrow(UnprocessableEntityException);
    });

    it('wraps repository error during validation', async () => {
      (usersRepository.findOne as jest.Mock).mockRejectedValueOnce(new Error('db down'));
      const dto = { email: 'a@b.com', password: 'x' } as any;
      await expect(service.createUser(dto)).rejects.toThrow('Error validateCreateUserRequest');
    });
  });

  describe('validateUser', () => {
    it('returns user when password matches', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({
        _id: 'u1',
        email: 'a@b.com',
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const user = await service.validateUser('a@b.com', 'secret');
      expect(user).toEqual(expect.objectContaining({ _id: 'u1' }));
      expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashed');
    });

    it('throws when user not found', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.validateUser('none@b.com', 'x')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when password mismatch', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(service.validateUser('a@b.com', 'bad')).rejects.toThrow('Credentials are not valid.');
    });
  });

  describe('getUserById', () => {
    it('returns user if found', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ _id: 'u1' });
      const u = await service.getUserById('u1');
      expect(u).toEqual({ _id: 'u1' } as any);
    });

    it('throws if not found', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.getUserById('missing')).rejects.toThrow('User not found');
    });
  });

  describe('getUsers (pagination/search)', () => {
    it('returns paginated results with transformed fields', async () => {
      (userModel.countDocuments as jest.Mock).mockResolvedValueOnce(23);
      ((userModel as any).exec as jest.Mock).mockResolvedValueOnce([
        {
          _id: { toString: () => 'u1' },
          email: 'a@b.com',
          displayName: 'Alice',
          role: 'buyer',
          isActive: true,
          createdAt: new Date('2020-01-01T00:00:00.000Z'),
          updatedAt: new Date('2020-01-02T00:00:00.000Z'),
        },
      ]);

      const res = await service.getUsers({ page: 2, limit: 10, search: 'Ali' } as any);

      expect(userModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      );
      expect(userModel.find).toHaveBeenCalled();
      expect(res.pagination).toEqual(
        expect.objectContaining({ page: 2, limit: 10, total: 23, totalPages: 3, hasNext: true, hasPrev: true }),
      );
      expect(res.data[0]).toEqual(
        expect.objectContaining({ _id: 'u1', email: 'a@b.com', displayName: 'Alice' }),
      );
    });
  });

  describe('updateUserProfile', () => {
    it('delegates to repository and sets lastSeen', async () => {
      (usersRepository.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'u1', city: 'Berlin' });
      const res = await service.updateUserProfile('u1', { city: 'Berlin' } as any);
      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'u1' },
        expect.objectContaining({ city: 'Berlin', lastSeen: expect.any(Date) }),
      );
      expect(res).toEqual({ _id: 'u1', city: 'Berlin' } as any);
    });
  });
});
