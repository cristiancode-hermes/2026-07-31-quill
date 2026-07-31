import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User, Story, Chapter, Scene, Character, CharacterRelationship, Location, TimelineEvent, WritingSession,
} from '../entities/entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Story, Chapter, Scene, Character, CharacterRelationship, Location, TimelineEvent, WritingSession,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
