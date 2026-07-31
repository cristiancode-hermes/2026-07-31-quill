import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  User, Story, Chapter, Scene, Character, CharacterRelationship, Location, TimelineEvent, WritingSession,
} from './entities/entities';
import { AuthModule } from './auth/auth.module';
import { StoriesModule } from './stories/stories.module';
import { ChaptersModule } from './chapters/chapters.module';
import { ScenesModule } from './scenes/scenes.module';
import { CharactersModule } from './characters/characters.module';
import { LocationsModule } from './locations/locations.module';
import { TimelineModule } from './timeline/timeline.module';
import { WritingSessionsModule } from './writing-sessions/writing-sessions.module';
import { StatsModule } from './stats/stats.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || './data/quill.db',
      entities: [
        User, Story, Chapter, Scene, Character, CharacterRelationship, Location, TimelineEvent, WritingSession,
      ],
      synchronize: true,
    }),
    AuthModule,
    StoriesModule,
    ChaptersModule,
    ScenesModule,
    CharactersModule,
    LocationsModule,
    TimelineModule,
    WritingSessionsModule,
    StatsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
