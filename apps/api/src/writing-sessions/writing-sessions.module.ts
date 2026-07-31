import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritingSession, Story } from '../entities/entities';
import { WritingSessionsService } from './writing-sessions.service';
import { WritingSessionsController } from './writing-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WritingSession, Story])],
  controllers: [WritingSessionsController],
  providers: [WritingSessionsService],
  exports: [WritingSessionsService],
})
export class WritingSessionsModule {}
