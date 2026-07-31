import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { StoriesService } from '../stories/stories.service';
import { Character, CharacterRelationship } from '../entities/entities';

describe('CharactersService', () => {
  let service: CharactersService;
  let relationshipsRepo: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock; delete: jest.Mock };
  const charactersRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((e) => Promise.resolve(e)),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const storiesService = {
    assertCharacterOwnership: jest.fn(),
    assertOwnership: jest.fn(),
  };

  beforeEach(async () => {
    relationshipsRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'rel-1' })),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getRepositoryToken(Character), useValue: charactersRepo },
        { provide: getRepositoryToken(CharacterRelationship), useValue: relationshipsRepo },
        { provide: StoriesService, useValue: storiesService },
      ],
    }).compile();

    service = moduleRef.get(CharactersService);
  });

  it('rejects a relationship with itself', async () => {
    storiesService.assertCharacterOwnership.mockImplementation(async (userId: string, id: string) => ({ id }));
    await expect(
      service.addRelationship('user-1', 'char-1', { targetCharacterId: 'char-1', type: 'friend' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects duplicate relationships of the same type', async () => {
    storiesService.assertCharacterOwnership.mockImplementation(async (_u: string, id: string) => ({ id }));
    relationshipsRepo.findOne.mockResolvedValue({ id: 'existing-rel' });
    await expect(
      service.addRelationship('user-1', 'char-1', { targetCharacterId: 'char-2', type: 'friend' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a relationship and normalizes direction in getRelationships', async () => {
    storiesService.assertCharacterOwnership.mockImplementation(async (_u: string, id: string) => ({ id }));
    const rel = await service.addRelationship('user-1', 'char-1', {
      targetCharacterId: 'char-2',
      type: 'mentor',
      description: 'old friend',
    });
    expect(rel.type).toBe('mentor');

    relationshipsRepo.find.mockImplementation(async ({ where }: { where: { sourceCharacterId?: string } }) =>
      where.sourceCharacterId === 'char-1'
        ? [{ id: 'rel-1', type: 'mentor', description: 'old friend', targetCharacter: { id: 'char-2', name: 'Seraphine' } }]
        : [],
    );
    const rels = await service.getRelationships('user-1', 'char-1');
    expect(rels).toHaveLength(1);
    expect(rels[0].direction).toBe('outgoing');
    expect(rels[0].otherCharacter.name).toBe('Seraphine');
  });

  it('deleting a character removes relationships in both directions', async () => {
    storiesService.assertCharacterOwnership.mockResolvedValue({ id: 'char-1', storyId: 'story-1' });
    await service.remove('user-1', 'char-1');
    expect(relationshipsRepo.delete).toHaveBeenCalledWith({ sourceCharacterId: 'char-1' });
    expect(relationshipsRepo.delete).toHaveBeenCalledWith({ targetCharacterId: 'char-1' });
    expect(charactersRepo.delete).toHaveBeenCalledWith('char-1');
  });
});
