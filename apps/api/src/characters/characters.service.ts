import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character, CharacterRelationship } from '../entities/entities';
import { StoriesService } from '../stories/stories.service';
import { CreateCharacterDto, UpdateCharacterDto, CreateRelationshipDto, UpdateRelationshipDto } from './dto/character.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private readonly charactersRepo: Repository<Character>,
    @InjectRepository(CharacterRelationship) private readonly relationshipsRepo: Repository<CharacterRelationship>,
    private readonly storiesService: StoriesService,
  ) {}

  async findAll(userId: string, storyId: string) {
    await this.storiesService.assertOwnership(userId, storyId);
    return this.charactersRepo.find({ where: { storyId }, order: { name: 'ASC' } });
  }

  async findOne(userId: string, id: string) {
    const character = await this.storiesService.assertCharacterOwnership(userId, id);
    const relationships = await this.getRelationships(userId, id);
    return { ...character, relationships };
  }

  async create(userId: string, storyId: string, dto: CreateCharacterDto) {
    await this.storiesService.assertOwnership(userId, storyId);
    const character = this.charactersRepo.create({
      storyId,
      ...dto,
      role: dto.role ?? undefined,
      age: dto.age ?? undefined,
      traits: dto.traits ?? undefined,
      appearance: dto.appearance ?? undefined,
      backstory: dto.backstory ?? undefined,
      goals: dto.goals ?? undefined,
      avatarColor: dto.avatarColor ?? undefined,
    } as any);
    return this.charactersRepo.save(character) as unknown as Character;
  }

  async update(userId: string, id: string, dto: UpdateCharacterDto) {
    const character = await this.storiesService.assertCharacterOwnership(userId, id);
    Object.assign(character, dto);
    return this.charactersRepo.save(character) as unknown as Character;
  }

  async remove(userId: string, id: string): Promise<void> {
    const character = await this.storiesService.assertCharacterOwnership(userId, id);
    await this.relationshipsRepo.delete({ sourceCharacterId: character.id });
    await this.relationshipsRepo.delete({ targetCharacterId: character.id });
    await this.charactersRepo.delete(character.id);
  }

  async getRelationships(userId: string, characterId: string) {
    await this.storiesService.assertCharacterOwnership(userId, characterId);
    const asSource = await this.relationshipsRepo.find({
      where: { sourceCharacterId: characterId },
      relations: { targetCharacter: true },
    });
    const asTarget = await this.relationshipsRepo.find({
      where: { targetCharacterId: characterId },
      relations: { sourceCharacter: true },
    });

    return [
      ...asSource.map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        direction: 'outgoing' as const,
        otherCharacter: r.targetCharacter,
      })),
      ...asTarget.map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        direction: 'incoming' as const,
        otherCharacter: r.sourceCharacter,
      })),
    ];
  }

  async addRelationship(userId: string, characterId: string, dto: CreateRelationshipDto) {
    const character = await this.storiesService.assertCharacterOwnership(userId, characterId);
    const target = await this.storiesService.assertCharacterOwnership(userId, dto.targetCharacterId);

    if (character.id === target.id) {
      throw new BadRequestException('A character cannot have a relationship with itself');
    }

    const existing = await this.relationshipsRepo.findOne({
      where: { sourceCharacterId: character.id, targetCharacterId: target.id, type: dto.type },
    });
    if (existing) {
      throw new BadRequestException('This relationship already exists');
    }

    const rel = this.relationshipsRepo.create({
      sourceCharacterId: character.id,
      targetCharacterId: target.id,
      type: dto.type,
      description: dto.description ?? undefined,
    } as any);
    return this.relationshipsRepo.save(rel) as unknown as CharacterRelationship;
  }

  async updateRelationship(userId: string, relationshipId: string, dto: UpdateRelationshipDto) {
    const rel = await this.findRelationshipOwned(userId, relationshipId);
    if (dto.type !== undefined) rel.type = dto.type;
    if (dto.description !== undefined) rel.description = dto.description;
    return this.relationshipsRepo.save(rel) as unknown as CharacterRelationship;
  }

  async removeRelationship(userId: string, relationshipId: string): Promise<void> {
    const rel = await this.findRelationshipOwned(userId, relationshipId);
    await this.relationshipsRepo.delete(rel.id);
  }

  private async findRelationshipOwned(userId: string, relationshipId: string) {
    const rel = await this.relationshipsRepo.findOne({ where: { id: relationshipId } });
    if (!rel) throw new BadRequestException('Relationship not found');
    await this.storiesService.assertCharacterOwnership(userId, rel.sourceCharacterId);
    return rel;
  }
}
