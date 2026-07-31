import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TimelineEvent, Character, Location } from '../entities/entities';
import { StoriesService } from '../stories/stories.service';
import { CreateTimelineEventDto, UpdateTimelineEventDto } from './dto/timeline.dto';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent) private readonly eventsRepo: Repository<TimelineEvent>,
    @InjectRepository(Character) private readonly charactersRepo: Repository<Character>,
    @InjectRepository(Location) private readonly locationsRepo: Repository<Location>,
    private readonly storiesService: StoriesService,
  ) {}

  async findAll(userId: string, storyId: string) {
    await this.storiesService.assertOwnership(userId, storyId);
    const events = await this.eventsRepo.find({
      where: { storyId },
      relations: { characters: true, locations: true },
      order: { eventDate: 'ASC', createdAt: 'ASC' },
    });
    return events;
  }

  async findOne(userId: string, id: string) {
    const event = await this.storiesService.assertEventOwnership(userId, id);
    const full = await this.eventsRepo.findOne({
      where: { id: event.id },
      relations: { characters: true, locations: true },
    });
    return full;
  }

  async create(userId: string, storyId: string, dto: CreateTimelineEventDto) {
    await this.storiesService.assertOwnership(userId, storyId);

    const event = this.eventsRepo.create({
      storyId,
      title: dto.title,
      description: dto.description,
      eventDate: dto.eventDate,
      eventType: dto.eventType ?? 'plot',
      importance: dto.importance ?? 1,
    } as any) as unknown as TimelineEvent;

    if (dto.characterIds?.length) {
      event.characters = await this.loadCharacters(userId, storyId, dto.characterIds);
    }
    if (dto.locationIds?.length) {
      event.locations = await this.loadLocations(userId, storyId, dto.locationIds);
    }

    const saved = await this.eventsRepo.save(event) as unknown as TimelineEvent;
    return this.eventsRepo.findOne({
      where: { id: saved.id },
      relations: { characters: true, locations: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateTimelineEventDto) {
    const event = await this.storiesService.assertEventOwnership(userId, id);

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.eventDate !== undefined) event.eventDate = dto.eventDate;
    if (dto.eventType !== undefined) event.eventType = dto.eventType;
    if (dto.importance !== undefined) event.importance = dto.importance;

    if (dto.characterIds !== undefined) {
      event.characters = await this.loadCharacters(userId, event.storyId, dto.characterIds);
    }
    if (dto.locationIds !== undefined) {
      event.locations = await this.loadLocations(userId, event.storyId, dto.locationIds);
    }

    const saved = await this.eventsRepo.save(event) as unknown as TimelineEvent;
    return this.eventsRepo.findOne({
      where: { id: saved.id },
      relations: { characters: true, locations: true },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const event = await this.storiesService.assertEventOwnership(userId, id);
    await this.eventsRepo.delete(event.id);
  }

  private async loadCharacters(userId: string, storyId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.charactersRepo.find({
      where: ids.map((id) => ({ id, storyId })),
    });
  }

  private async loadLocations(userId: string, storyId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.locationsRepo.find({
      where: ids.map((id) => ({ id, storyId })),
    });
  }
}
