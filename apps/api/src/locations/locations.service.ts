import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities/entities';
import { StoriesService } from '../stories/stories.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

export interface LocationTreeNode extends Location {
  children: LocationTreeNode[];
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locationsRepo: Repository<Location>,
    private readonly storiesService: StoriesService,
  ) {}

  async findAll(userId: string, storyId: string) {
    await this.storiesService.assertOwnership(userId, storyId);
    return this.locationsRepo.find({
      where: { storyId },
      order: { name: 'ASC' },
    });
  }

  async getTree(userId: string, storyId: string): Promise<LocationTreeNode[]> {
    const locations = await this.findAll(userId, storyId);
    return this.buildTree(locations);
  }

  async findOne(userId: string, id: string) {
    const location = await this.storiesService.assertLocationOwnership(userId, id);
    const children = await this.locationsRepo.find({
      where: { parentId: id },
      order: { name: 'ASC' },
    });
    return { ...location, children };
  }

  async create(userId: string, storyId: string, dto: CreateLocationDto) {
    await this.storiesService.assertOwnership(userId, storyId);
    if (dto.parentId) {
      const parent = await this.storiesService.assertLocationOwnership(userId, dto.parentId);
      if (parent.storyId !== storyId) {
        throw new BadRequestException('Parent location must belong to the same story');
      }
    }
    const location = this.locationsRepo.create({
      storyId,
      name: dto.name,
      type: dto.type,
      parentId: dto.parentId ?? undefined,
      description: dto.description ?? undefined,
      climate: dto.climate ?? undefined,
      population: dto.population ?? undefined,
    } as any);
    return this.locationsRepo.save(location) as unknown as Location;
  }

  async update(userId: string, id: string, dto: UpdateLocationDto) {
    const location = await this.storiesService.assertLocationOwnership(userId, id);
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A location cannot be its own parent');
      }
      if (dto.parentId) {
        await this.storiesService.assertLocationOwnership(userId, dto.parentId);
      }
      location.parentId = dto.parentId || null;
    }
    if (dto.name !== undefined) location.name = dto.name;
    if (dto.type !== undefined) location.type = dto.type;
    if (dto.description !== undefined) location.description = dto.description;
    if (dto.climate !== undefined) location.climate = dto.climate;
    if (dto.population !== undefined) location.population = dto.population;
    return this.locationsRepo.save(location) as unknown as Location;
  }

  async remove(userId: string, id: string): Promise<void> {
    const location = await this.storiesService.assertLocationOwnership(userId, id);
    // Detach children
    const children = await this.locationsRepo.find({ where: { parentId: id } });
    for (const child of children) {
      child.parentId = null;
      await this.locationsRepo.save(child);
    }
    await this.locationsRepo.delete(location.id);
  }

  private buildTree(locations: Location[]): LocationTreeNode[] {
    const map = new Map<string, LocationTreeNode>();
    const roots: LocationTreeNode[] = [];
    for (const loc of locations) {
      map.set(loc.id, { ...loc, children: [] });
    }
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
