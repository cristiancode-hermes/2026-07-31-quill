import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ScenesService, countWords } from './scenes.service';
import { StoriesService } from '../stories/stories.service';
import { Scene, Chapter } from '../entities/entities';

describe('countWords', () => {
  it('counts words in a simple sentence', () => {
    expect(countWords('one two three four five')).toBe(5);
  });

  it('returns 0 for empty or whitespace-only content', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n  ')).toBe(0);
  });

  it('handles markdown and punctuation without inflating the count', () => {
    expect(countWords('**bold** _italic_ `code`')).toBe(3);
    // simple whitespace split: markdown symbols attached to words stay attached
    expect(countWords('# Heading\n\nA paragraph with, punctuation!')).toBe(6);
  });
});

describe('ScenesService', () => {
  let service: ScenesService;
  let scenesRepo: { find: jest.Mock; count: jest.Mock; create: jest.Mock; save: jest.Mock; delete: jest.Mock };
  const storiesService = {
    assertChapterOwnership: jest.fn().mockResolvedValue({ id: 'chapter-1', storyId: 'story-1' }),
    assertSceneOwnership: jest.fn(),
  };

  beforeEach(async () => {
    scenesRepo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((data) => data),
      save: jest.fn((e) => Promise.resolve(e)),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScenesService,
        { provide: getRepositoryToken(Scene), useValue: scenesRepo },
        { provide: getRepositoryToken(Chapter), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: StoriesService, useValue: storiesService },
      ],
    }).compile();

    service = moduleRef.get(ScenesService);
  });

  it('creates a scene and computes wordCount on save', async () => {
    scenesRepo.save.mockImplementation((e: Scene) => Promise.resolve({ ...e, id: 'scene-1' }));
    const scene = await service.create('user-1', 'chapter-1', {
      title: 'The map room',
      content: 'Kael unrolled the parchment across the table.',
    });
    expect(scene.wordCount).toBe(7);
    expect(scenesRepo.create).toHaveBeenCalledWith(expect.objectContaining({ position: 0, wordCount: 7 }));
  });

  it('recalculates wordCount when content is updated', async () => {
    const existing = { id: 'scene-1', chapterId: 'chapter-1', content: 'old text here', wordCount: 3 } as Scene;
    storiesService.assertSceneOwnership.mockResolvedValue(existing);
    scenesRepo.save.mockImplementation((e: Scene) => Promise.resolve({ ...e, id: 'scene-1' }));

    const updated = await service.update('user-1', 'scene-1', { content: 'completely new and longer content' });
    expect(updated.wordCount).toBe(5);
    expect(existing.content).toBe('completely new and longer content');
  });

  it('appends scenes to the end by position', async () => {
    scenesRepo.count.mockResolvedValue(2);
    await service.create('user-1', 'chapter-1', { title: 'Third scene', content: 'a b c' });
    expect(scenesRepo.create).toHaveBeenCalledWith(expect.objectContaining({ position: 2 }));
  });
});

describe('ScenesService — chapter ownership validation', () => {
  it('rejects scenes in chapters the user does not own', async () => {
    const storiesService = {
      assertChapterOwnership: jest.fn().mockRejectedValue(new BadRequestException('Not your story')),
      assertSceneOwnership: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScenesService,
        { provide: getRepositoryToken(Scene), useValue: { find: jest.fn(), count: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: getRepositoryToken(Chapter), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: StoriesService, useValue: storiesService },
      ],
    }).compile();

    const svc = moduleRef.get(ScenesService);
    await expect(svc.create('user-1', 'foreign-chapter', { content: 'x y z' })).rejects.toThrow(BadRequestException);
  });
});
