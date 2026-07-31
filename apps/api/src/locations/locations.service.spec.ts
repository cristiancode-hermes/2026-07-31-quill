import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationsService, LocationTreeNode } from './locations.service';
import { StoriesService } from '../stories/stories.service';
import { Location } from '../entities/entities';

describe('LocationsService', () => {
  let service: LocationsService;
  const locationsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((e) => Promise.resolve(e)),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const storiesService = { assertOwnership: jest.fn(), assertLocationOwnership: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locationsRepo },
        { provide: StoriesService, useValue: storiesService },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('builds a nested tree from a flat location list', () => {
    const flat = [
      { id: 'world', parentId: null, name: 'Aerthos' },
      { id: 'valley', parentId: 'world', name: 'Amber Valley' },
      { id: 'hall', parentId: 'valley', name: 'Throne Hall' },
      { id: 'city', parentId: null, name: 'Veyra' },
    ] as Location[];

    const tree = (service as unknown as { buildTree(locs: Location[]): LocationTreeNode[] })['buildTree'](flat);

    expect(tree).toHaveLength(2);
    const world = tree.find((n) => n.id === 'world')!;
    expect(world.children).toHaveLength(1);
    expect(world.children[0].id).toBe('valley');
    expect(world.children[0].children[0].id).toBe('hall');
    expect(tree.find((n) => n.id === 'city')!.children).toHaveLength(0);
  });

  it('rejects creating a child location under a parent from a different story', async () => {
    storiesService.assertLocationOwnership.mockResolvedValue({ id: 'parent', storyId: 'story-2' });
    storiesService.assertOwnership.mockResolvedValue({});
    await expect(
      service.create('user-1', 'story-1', { name: 'Bad', type: 'room', parentId: 'parent' }),
    ).rejects.toThrow();
  });

  it('detaches children instead of deleting them when a location is removed', async () => {
    storiesService.assertLocationOwnership.mockResolvedValue({ id: 'loc-1', storyId: 'story-1' });
    const child = { id: 'child-1', parentId: 'loc-1' } as Location;
    locationsRepo.find.mockResolvedValue([child]);
    await service.remove('user-1', 'loc-1');
    expect(child.parentId).toBeNull();
    expect(locationsRepo.save).toHaveBeenCalledWith(child);
    expect(locationsRepo.delete).toHaveBeenCalledWith('loc-1');
  });
});
