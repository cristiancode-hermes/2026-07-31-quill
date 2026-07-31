import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../entities/entities';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Location]), StoriesModule],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
