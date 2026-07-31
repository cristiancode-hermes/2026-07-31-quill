import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter, Scene } from '../entities/entities';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Scene]), StoriesModule],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
