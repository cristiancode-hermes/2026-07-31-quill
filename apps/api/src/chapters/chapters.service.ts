import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter, Scene } from '../entities/entities';
import { StoriesService } from '../stories/stories.service';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter) private readonly chaptersRepo: Repository<Chapter>,
    @InjectRepository(Scene) private readonly scenesRepo: Repository<Scene>,
    private readonly storiesService: StoriesService,
  ) {}

  async findAll(userId: string, storyId: string) {
    await this.storiesService.assertOwnership(userId, storyId);
    const chapters = await this.chaptersRepo.find({
      where: { storyId },
      order: { position: 'ASC' },
    });

    const result: (Chapter & { sceneCount: number; totalWords: number })[] = [];
    for (const chapter of chapters) {
      const scenes = await this.scenesRepo.find({ where: { chapterId: chapter.id } });
      result.push({
        ...chapter,
        sceneCount: scenes.length,
        totalWords: scenes.reduce((sum, s) => sum + s.wordCount, 0),
      });
    }
    return result;
  }

  async findOne(userId: string, id: string) {
    const chapter = await this.storiesService.assertChapterOwnership(userId, id);
    const scenes = await this.scenesRepo.find({
      where: { chapterId: id },
      order: { position: 'ASC' },
    });
    const totalWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);
    return { ...chapter, sceneCount: scenes.length, totalWords, scenes };
  }

  async create(userId: string, storyId: string, dto: CreateChapterDto) {
    await this.storiesService.assertOwnership(userId, storyId);
    const count = await this.chaptersRepo.count({ where: { storyId } });
    const chapter = this.chaptersRepo.create({
      storyId,
      title: dto.title,
      position: count,
      wordGoal: dto.wordGoal ?? undefined,
      notes: dto.notes ?? undefined,
      status: 'draft',
    } as any);
    return this.chaptersRepo.save(chapter) as unknown as Chapter;
  }

  async update(userId: string, id: string, dto: UpdateChapterDto) {
    const chapter = await this.storiesService.assertChapterOwnership(userId, id);
    Object.assign(chapter, dto);
    return this.chaptersRepo.save(chapter) as unknown as Chapter;
  }

  async remove(userId: string, id: string): Promise<void> {
    const chapter = await this.storiesService.assertChapterOwnership(userId, id);
    await this.chaptersRepo.delete(chapter.id);
    // Re-normalize positions
    const siblings = await this.chaptersRepo.find({
      where: { storyId: chapter.storyId },
      order: { position: 'ASC' },
    });
    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i].position !== i) {
        siblings[i].position = i;
        await this.chaptersRepo.save(siblings[i]);
      }
    }
  }

  async reorder(userId: string, storyId: string, orderedIds: string[]) {
    await this.storiesService.assertOwnership(userId, storyId);
    const chapters = await this.chaptersRepo.find({ where: { storyId } });
    const byId = new Map(chapters.map((c) => [c.id, c]));

    for (let i = 0; i < orderedIds.length; i++) {
      const chapter = byId.get(orderedIds[i]);
      if (!chapter) throw new NotFoundException(`Chapter ${orderedIds[i]} not found in story`);
      chapter.position = i;
      await this.chaptersRepo.save(chapter);
    }
    return this.chaptersRepo.find({
      where: { storyId },
      order: { position: 'ASC' },
    });
  }
}
