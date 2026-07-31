import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character, CharacterRelationship } from '../entities/entities';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character, CharacterRelationship]), StoriesModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
