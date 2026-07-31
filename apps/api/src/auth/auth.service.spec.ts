import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/entities';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

  const makeUser = (overrides: Partial<User> = {}) => ({
    id: 'user-1',
    email: 'writer@example.com',
    username: 'quillwriter',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv', // fake hash
    dailyWordGoal: 500,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User);

  beforeEach(async () => {
    usersRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'user-1' })),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('registers a user and returns a JWT', async () => {
    const result = await service.register({
      email: 'writer@example.com',
      username: 'quillwriter',
      password: 'secret123',
    });
    expect(result.token).toBe('signed-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.username).toBe('quillwriter');
    // password must be hashed, not stored in plain text
    const createCall = usersRepo.create.mock.calls[0][0];
    expect(createCall.passwordHash).not.toBe('secret123');
    expect(createCall.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email', async () => {
    usersRepo.findOne.mockImplementation(async ({ where }: { where: { email?: string } }) =>
      where.email ? makeUser() : null,
    );
    await expect(
      service.register({ email: 'writer@example.com', username: 'other', password: 'secret123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a duplicate username', async () => {
    usersRepo.findOne.mockImplementation(async ({ where }: { where: { username?: string } }) =>
      where.username ? makeUser() : null,
    );
    await expect(
      service.register({ email: 'new@example.com', username: 'quillwriter', password: 'secret123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects login with wrong password', async () => {
    const user = makeUser({ passwordHash: await bcrypt.hash('right-password', 4) });
    usersRepo.findOne.mockResolvedValue(user);
    await expect(
      service.login({ email: 'writer@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logs in with correct credentials', async () => {
    const user = makeUser({ passwordHash: await bcrypt.hash('secret123', 4) });
    usersRepo.findOne.mockResolvedValue(user);
    const result = await service.login({ email: 'writer@example.com', password: 'secret123' });
    expect(result.token).toBe('signed-token');
    expect(result.user.id).toBe('user-1');
  });

  it('updates the daily word goal via profile update', async () => {
    const user = makeUser();
    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.save.mockImplementation((e: User) => Promise.resolve({ ...e, id: 'user-1' }));
    const updated = await service.updateProfile('user-1', { dailyWordGoal: 2500 });
    expect(updated.dailyWordGoal).toBe(2500);
  });
});
