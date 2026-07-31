import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User, Story, WritingSession, Character, Chapter, Scene, Location, TimelineEvent,
} from '../entities/entities';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Story, WritingSession, Character, Chapter, Scene, Location, TimelineEvent,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
