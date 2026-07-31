import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/entities';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }
    const existingUsername = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    } as any);
    const saved = await this.usersRepo.save(user) as unknown as User;

    return this.buildAuthResponse(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (dto.username !== undefined && dto.username !== user.username) {
      const taken = await this.usersRepo.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('Username is already taken');
      user.username = dto.username;
    }
    if (dto.dailyWordGoal !== undefined) user.dailyWordGoal = dto.dailyWordGoal;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl || null;

    const saved = await this.usersRepo.save(user) as unknown as User;
    return this.sanitize(saved);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);
    return { message: 'Password updated successfully' };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id: userId } });
  }

  private buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
      user: this.sanitize(user),
    };
  }

  private sanitize(user: User) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
