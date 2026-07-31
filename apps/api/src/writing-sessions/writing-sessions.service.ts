import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WritingSession, Story } from '../entities/entities';
import { CreateWritingSessionDto } from './dto/writing-session.dto';

@Injectable()
export class WritingSessionsService {
  constructor(
    @InjectRepository(WritingSession) private readonly sessionsRepo: Repository<WritingSession>,
    @InjectRepository(Story) private readonly storiesRepo: Repository<Story>,
  ) {}

  async findAll(userId: string, from?: string, to?: string, storyId?: string) {
    const where: Record<string, unknown> = { userId };
    if (from || to) {
      where.sessionDate = Between(from ?? '1970-01-01', to ?? '2999-12-31');
    }
    if (storyId) {
      const story = await this.storiesRepo.findOne({ where: { id: storyId, userId } });
      if (!story) throw new NotFoundException('Story not found');
      where.storyId = storyId;
    }
    return this.sessionsRepo.find({
      where: where as never,
      order: { sessionDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateWritingSessionDto) {
    if (dto.storyId) {
      const story = await this.storiesRepo.findOne({ where: { id: dto.storyId, userId } });
      if (!story) throw new NotFoundException('Story not found');
    }
    const session = this.sessionsRepo.create({
      userId,
      wordsWritten: dto.wordsWritten,
      durationMinutes: dto.durationMinutes,
      storyId: dto.storyId ?? undefined,
      notes: dto.notes ?? undefined,
      sessionDate: dto.sessionDate ?? new Date().toISOString().slice(0, 10),
    } as any);
    return this.sessionsRepo.save(session) as unknown as WritingSession;
  }

  async remove(userId: string, id: string): Promise<void> {
    const session = await this.sessionsRepo.findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.sessionsRepo.delete(session.id);
  }
}
