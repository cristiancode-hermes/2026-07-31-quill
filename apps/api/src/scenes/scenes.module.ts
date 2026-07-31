import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scene, Chapter } from '../entities/entities';
import { ScenesService } from './scenes.service';
import { ScenesController } from './scenes.controller';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Scene, Chapter]), StoriesModule],
  controllers: [ScenesController],
  providers: [ScenesService],
  exports: [ScenesService],
})
export class ScenesModule {}
