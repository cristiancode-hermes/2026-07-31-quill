import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story, Chapter, Scene, Character, Location, TimelineEvent } from '../entities/entities';
import { CreateStoryDto, UpdateStoryDto } from './dto/story.dto';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story) private readonly storiesRepo: Repository<Story>,
    @InjectRepository(Chapter) private readonly chaptersRepo: Repository<Chapter>,
    @InjectRepository(Scene) private readonly scenesRepo: Repository<Scene>,
    @InjectRepository(Character) private readonly charactersRepo: Repository<Character>,
    @InjectRepository(Location) private readonly locationsRepo: Repository<Location>,
    @InjectRepository(TimelineEvent) private readonly eventsRepo: Repository<TimelineEvent>,
  ) {}

  async findAll(userId: string): Promise<Story[]> {
    return this.storiesRepo.find({
      where: { userId, isArchived: false },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const story = await this.storiesRepo.findOne({ where: { id, userId } });
    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  async findWithStats(userId: string, id: string) {
    const story = await this.findOne(userId, id);
    const stats = await this.computeStoryStats(id);
    return { ...story, stats };
  }

  async create(userId: string, dto: CreateStoryDto): Promise<Story> {
    const story = this.storiesRepo.create({
      ...dto,
      userId,
      isArchived: false,
    } as any);
    return this.storiesRepo.save(story) as unknown as Story;
  }

  async update(userId: string, id: string, dto: UpdateStoryDto): Promise<Story> {
    const story = await this.findOne(userId, id);
    Object.assign(story, dto);
    return this.storiesRepo.save(story) as unknown as Story;
  }

  async archive(userId: string, id: string): Promise<void> {
    const story = await this.findOne(userId, id);
    story.isArchived = true;
    await this.storiesRepo.save(story);
  }

  async computeStoryStats(storyId: string) {
    const [totalWords, chapterCount, sceneCount, characterCount, locationCount, eventCount] =
      await Promise.all([
        this.chaptersRepo
          .createQueryBuilder('c')
          .innerJoin('scenes', 's', 's.chapterId = c.id')
          .select('COALESCE(SUM(s.wordCount), 0)', 'total')
          .where('c.storyId = :storyId', { storyId })
          .getRawOne<{ total: number | string }>(),
        this.chaptersRepo.count({ where: { storyId } }),
        this.scenesRepo
          .createQueryBuilder('s')
          .innerJoin('chapters', 'c', 'c.id = s.chapterId')
          .where('c.storyId = :storyId', { storyId })
          .getCount(),
        this.charactersRepo.count({ where: { storyId } }),
        this.locationsRepo.count({ where: { storyId } }),
        this.eventsRepo.count({ where: { storyId } }),
      ]);

    const chapters = await this.chaptersRepo.find({
      where: { storyId },
      order: { position: 'ASC' },
    });

    const wordsPerChapter: { chapterId: string; title: string; words: number; position: number }[] = [];
    for (const chapter of chapters) {
      const row = await this.scenesRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.wordCount), 0)', 'total')
        .where('s.chapterId = :chapterId', { chapterId: chapter.id })
        .getRawOne<{ total: number | string }>();
      wordsPerChapter.push({
        chapterId: chapter.id,
        title: chapter.title,
        words: Number(row?.total ?? 0),
        position: chapter.position,
      });
    }

    return {
      totalWords: Number(totalWords?.total ?? 0),
      chapterCount,
      sceneCount,
      characterCount,
      locationCount,
      eventCount,
      wordsPerChapter,
    };
  }

  async assertOwnership(userId: string, storyId: string): Promise<Story> {
    return this.findOne(userId, storyId);
  }

  async assertChapterOwnership(userId: string, chapterId: string): Promise<Chapter> {
    const chapter = await this.chaptersRepo.findOne({ where: { id: chapterId } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    const story = await this.findOne(userId, chapter.storyId);
    if (!story) throw new ForbiddenException('Not your story');
    return chapter;
  }

  async assertSceneOwnership(userId: string, sceneId: string): Promise<Scene> {
    const scene = await this.scenesRepo.findOne({ where: { id: sceneId } });
    if (!scene) throw new NotFoundException('Scene not found');
    await this.assertChapterOwnership(userId, scene.chapterId);
    return scene;
  }

  async assertCharacterOwnership(userId: string, characterId: string): Promise<Character> {
    const character = await this.charactersRepo.findOne({ where: { id: characterId } });
    if (!character) throw new NotFoundException('Character not found');
    await this.findOne(userId, character.storyId);
    return character;
  }

  async assertLocationOwnership(userId: string, locationId: string): Promise<Location> {
    const location = await this.locationsRepo.findOne({ where: { id: locationId } });
    if (!location) throw new NotFoundException('Location not found');
    await this.findOne(userId, location.storyId);
    return location;
  }

  async assertEventOwnership(userId: string, eventId: string): Promise<TimelineEvent> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Timeline event not found');
    await this.findOne(userId, event.storyId);
    return event;
  }
}
