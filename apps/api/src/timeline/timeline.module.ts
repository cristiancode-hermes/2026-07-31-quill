import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineEvent, Character, Location } from '../entities/entities';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimelineEvent, Character, Location]), StoriesModule],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
