import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Story, WritingSession, Character, Chapter, Scene, Location, TimelineEvent } from '../entities/entities';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Story) private readonly storiesRepo: Repository<Story>,
    @InjectRepository(WritingSession) private readonly sessionsRepo: Repository<WritingSession>,
    @InjectRepository(Character) private readonly charactersRepo: Repository<Character>,
    @InjectRepository(Chapter) private readonly chaptersRepo: Repository<Chapter>,
    @InjectRepository(Scene) private readonly scenesRepo: Repository<Scene>,
    @InjectRepository(Location) private readonly locationsRepo: Repository<Location>,
    @InjectRepository(TimelineEvent) private readonly eventsRepo: Repository<TimelineEvent>,
  ) {}

  async getDashboardStats(userId: string) {
    const [user, stories, sessions] = await Promise.all([
      this.usersRepo.findOne({ where: { id: userId } }),
      this.storiesRepo.find({ where: { userId, isArchived: false }, order: { updatedAt: 'DESC' } }),
      this.sessionsRepo.find({ where: { userId } }),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const totalWords = sessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const todayWords = sessions
      .filter((s) => s.sessionDate === today)
      .reduce((sum, s) => sum + s.wordsWritten, 0);

    // Streak: consecutive days ending today or yesterday with sessions
    const days = new Set(sessions.map((s) => s.sessionDate));
    let streak = 0;
    let cursor = new Date();
    if (!days.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1); // allow streak that ended yesterday
    }
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Total words in scenes (written content)
    const sceneWords = await this.getTotalSceneWords(userId);

    return {
      totalWords: totalWords + sceneWords,
      todayWords,
      dailyGoal: user?.dailyWordGoal ?? 500,
      streak,
      storyCount: stories.length,
      characterCount: await this.charactersRepo
        .createQueryBuilder('c')
        .innerJoin('stories', 's', 's.id = c.storyId')
        .where('s.userId = :userId AND s.isArchived = false', { userId })
        .getCount(),
      recentStories: stories.slice(0, 6),
    };
  }

  async getWeeklyWords(userId: string) {
    const result: { date: string; words: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const sessions = await this.sessionsRepo.find({ where: { userId, sessionDate: date } });
      result.push({
        date,
        words: sessions.reduce((sum, s) => sum + s.wordsWritten, 0),
      });
    }
    return result;
  }

  async getStoryStats(userId: string, storyId: string) {
    const story = await this.storiesRepo.findOne({ where: { id: storyId, userId } });
    if (!story) return null;

    const [chapterCount, sceneCount, characterCount, locationCount, eventCount, sessionWords] =
      await Promise.all([
        this.chaptersRepo.count({ where: { storyId } }),
        this.scenesRepo
          .createQueryBuilder('s')
          .innerJoin('chapters', 'c', 'c.id = s.chapterId')
          .where('c.storyId = :storyId', { storyId })
          .getCount(),
        this.charactersRepo.count({ where: { storyId } }),
        this.locationsRepo.count({ where: { storyId } }),
        this.eventsRepo.count({ where: { storyId } }),
        this.sessionsRepo
          .createQueryBuilder('w')
          .select('COALESCE(SUM(w.wordsWritten), 0)', 'total')
          .where('w.userId = :userId AND w.storyId = :storyId', { userId, storyId })
          .getRawOne<{ total: number | string }>(),
      ]);

    const chapters = await this.chaptersRepo.find({
      where: { storyId },
      order: { position: 'ASC' },
    });
    const wordsPerChapter: { chapterId: string; title: string; words: number; position: number }[] = [];
    for (const chapter of chapters) {
      const row = await this.scenesRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.wordCount), 0)', 'total')
        .where('s.chapterId = :chapterId', { chapterId: chapter.id })
        .getRawOne<{ total: number | string }>();
      wordsPerChapter.push({
        chapterId: chapter.id,
        title: chapter.title,
        words: Number(row?.total ?? 0),
        position: chapter.position,
      });
    }

    const sceneWords = wordsPerChapter.reduce((sum, c) => sum + c.words, 0);

    return {
      totalWords: sceneWords + Number(sessionWords?.total ?? 0),
      chapterCount,
      sceneCount,
      characterCount,
      locationCount,
      eventCount,
      wordsPerChapter,
    };
  }

  private async getTotalSceneWords(userId: string): Promise<number> {
    const row = await this.scenesRepo
      .createQueryBuilder('s')
      .innerJoin('chapters', 'c', 'c.id = s.chapterId')
      .innerJoin('stories', 'st', 'st.id = c.storyId')
      .select('COALESCE(SUM(s.wordCount), 0)', 'total')
      .where('st.userId = :userId AND st.isArchived = false', { userId })
      .getRawOne<{ total: number | string }>();
    return Number(row?.total ?? 0);
  }
}
