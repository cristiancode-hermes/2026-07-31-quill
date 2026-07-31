import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story, Chapter, Scene, Character, Location, TimelineEvent } from '../entities/entities';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, Chapter, Scene, Character, Location, TimelineEvent]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
