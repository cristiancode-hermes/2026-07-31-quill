import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { Story, Chapter, Scene, Character, Location, TimelineEvent } from '../entities/entities';

describe('StoriesService', () => {
  let service: StoriesService;
  let storiesRepo: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  const emptyRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((data) => data),
    save: jest.fn((e) => Promise.resolve(e)),
    delete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  beforeEach(async () => {
    storiesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'story-1' })),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: getRepositoryToken(Story), useValue: storiesRepo },
        { provide: getRepositoryToken(Chapter), useValue: emptyRepo },
        { provide: getRepositoryToken(Scene), useValue: emptyRepo },
        { provide: getRepositoryToken(Character), useValue: emptyRepo },
        { provide: getRepositoryToken(Location), useValue: emptyRepo },
        { provide: getRepositoryToken(TimelineEvent), useValue: emptyRepo },
      ],
    }).compile();

    service = moduleRef.get(StoriesService);
  });

  it('creates a story owned by the user', async () => {
    const story = await service.create('user-1', { title: 'The Amber Throne', genre: 'Fantasy' });
    expect(storiesRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', isArchived: false }));
    expect(story.id).toBe('story-1');
  });

  it('throws NotFound when a user opens someone else\'s story', async () => {
    storiesRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('user-1', 'foreign-story')).rejects.toThrow(NotFoundException);
  });

  it('only lists non-archived stories for the owner', async () => {
    await service.findAll('user-1');
    expect(storiesRepo.find).toHaveBeenCalledWith({
      where: { userId: 'user-1', isArchived: false },
      order: { updatedAt: 'DESC' },
    });
  });

  it('archives a story (soft delete) instead of hard deleting', async () => {
    const story = { id: 'story-1', userId: 'user-1', isArchived: false } as Story;
    storiesRepo.findOne.mockResolvedValue(story);
    await service.archive('user-1', 'story-1');
    expect(story.isArchived).toBe(true);
    expect(storiesRepo.save).toHaveBeenCalledWith(story);
  });
});

describe('StoriesService — per-story stats aggregation', () => {
  it('computes total words across chapters with the aggregation query', async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '173' }),
      getCount: jest.fn().mockResolvedValue(3),
    };
    const sceneQb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '50' }),
      getCount: jest.fn().mockResolvedValue(4),
    };
    const repo = {
      find: jest.fn().mockResolvedValue([
        { id: 'c1', title: 'One', position: 0 },
        { id: 'c2', title: 'Two', position: 1 },
      ]),
      count: jest.fn().mockResolvedValue(2),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const scenesRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(sceneQb),
      count: jest.fn().mockResolvedValue(4),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: getRepositoryToken(Story), useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', userId: 'u1' }) } },
        { provide: getRepositoryToken(Chapter), useValue: repo },
        { provide: getRepositoryToken(Scene), useValue: scenesRepo },
        { provide: getRepositoryToken(Character), useValue: { count: jest.fn().mockResolvedValue(5) } },
        { provide: getRepositoryToken(Location), useValue: { count: jest.fn().mockResolvedValue(2) } },
        { provide: getRepositoryToken(TimelineEvent), useValue: { count: jest.fn().mockResolvedValue(3) } },
      ],
    }).compile();

    const svc = moduleRef.get(StoriesService);
    const stats = await svc.computeStoryStats('s1');
    expect(stats.totalWords).toBe(173);
    expect(stats.chapterCount).toBe(2);
    expect(stats.sceneCount).toBe(4);
    expect(stats.characterCount).toBe(5);
    expect(stats.eventCount).toBe(3);
    expect(stats.wordsPerChapter).toHaveLength(2);
    expect(stats.wordsPerChapter[0]).toEqual({ chapterId: 'c1', title: 'One', words: 50, position: 0 });
  });
});
