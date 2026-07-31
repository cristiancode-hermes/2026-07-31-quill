import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scene, Chapter } from '../entities/entities';
import { StoriesService } from '../stories/stories.service';
import { CreateSceneDto, UpdateSceneDto } from './dto/scene.dto';

export function countWords(content: string): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class ScenesService {
  constructor(
    @InjectRepository(Scene) private readonly scenesRepo: Repository<Scene>,
    @InjectRepository(Chapter) private readonly chaptersRepo: Repository<Chapter>,
    private readonly storiesService: StoriesService,
  ) {}

  async findAll(userId: string, chapterId: string) {
    await this.storiesService.assertChapterOwnership(userId, chapterId);
    return this.scenesRepo.find({
      where: { chapterId },
      order: { position: 'ASC' },
    });
  }

  async findOne(userId: string, id: string) {
    const scene = await this.storiesService.assertSceneOwnership(userId, id);
    return scene;
  }

  async create(userId: string, chapterId: string, dto: CreateSceneDto) {
    await this.storiesService.assertChapterOwnership(userId, chapterId);
    const count = await this.scenesRepo.count({ where: { chapterId } });
    const content = dto.content ?? '';
    const scene = this.scenesRepo.create({
      chapterId,
      title: dto.title ?? undefined,
      position: count,
      content,
      wordCount: countWords(content),
      notes: dto.notes ?? undefined,
    } as any);
    return this.scenesRepo.save(scene) as unknown as Scene;
  }

  async update(userId: string, id: string, dto: UpdateSceneDto) {
    const scene = await this.storiesService.assertSceneOwnership(userId, id);
    if (dto.content !== undefined) {
      scene.content = dto.content;
      scene.wordCount = countWords(dto.content);
    }
    if (dto.title !== undefined) scene.title = dto.title;
    if (dto.notes !== undefined) scene.notes = dto.notes;
    return this.scenesRepo.save(scene) as unknown as Scene;
  }

  async remove(userId: string, id: string): Promise<void> {
    const scene = await this.storiesService.assertSceneOwnership(userId, id);
    await this.scenesRepo.delete(scene.id);
    const siblings = await this.scenesRepo.find({
      where: { chapterId: scene.chapterId },
      order: { position: 'ASC' },
    });
    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i].position !== i) {
        siblings[i].position = i;
        await this.scenesRepo.save(siblings[i]);
      }
    }
  }

  async reorder(userId: string, chapterId: string, orderedIds: string[]) {
    await this.storiesService.assertChapterOwnership(userId, chapterId);
    const scenes = await this.scenesRepo.find({ where: { chapterId } });
    const byId = new Map(scenes.map((s) => [s.id, s]));
    for (let i = 0; i < orderedIds.length; i++) {
      const scene = byId.get(orderedIds[i]);
      if (!scene) throw new NotFoundException(`Scene ${orderedIds[i]} not found in chapter`);
      scene.position = i;
      await this.scenesRepo.save(scene);
    }
    return this.scenesRepo.find({ where: { chapterId }, order: { position: 'ASC' } });
  }

  /** Get chapter for navigation (prev/next scene) */
  async getChapterScenes(userId: string, chapterId: string) {
    await this.storiesService.assertChapterOwnership(userId, chapterId);
    return this.scenesRepo.find({ where: { chapterId }, order: { position: 'ASC' } });
  }
}
