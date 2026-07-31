import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  User, Story, Chapter, Scene, Character, CharacterRelationship, Location, TimelineEvent, WritingSession,
} from '../entities/entities';
import { countWords } from '../scenes/scenes.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Story) private readonly storiesRepo: Repository<Story>,
    @InjectRepository(Chapter) private readonly chaptersRepo: Repository<Chapter>,
    @InjectRepository(Scene) private readonly scenesRepo: Repository<Scene>,
    @InjectRepository(Character) private readonly charactersRepo: Repository<Character>,
    @InjectRepository(CharacterRelationship) private readonly relationshipsRepo: Repository<CharacterRelationship>,
    @InjectRepository(Location) private readonly locationsRepo: Repository<Location>,
    @InjectRepository(TimelineEvent) private readonly eventsRepo: Repository<TimelineEvent>,
    @InjectRepository(WritingSession) private readonly sessionsRepo: Repository<WritingSession>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DB !== 'true') return;
    const existing = await this.usersRepo.findOne({ where: { username: 'quilldemo' } });
    if (existing) {
      this.logger.log('Seed data already present, skipping');
      return;
    }
    await this.seed();
  }

  async seed() {
    this.logger.log('Seeding Quill demo data...');

    const passwordHash = await bcrypt.hash('demo1234', 10);
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        email: 'demo@quill.app',
        username: 'quilldemo',
        passwordHash,
        dailyWordGoal: 1000,
      } as any),
    ) as unknown as User;

    const story = await this.storiesRepo.save(
      this.storiesRepo.create({
        userId: user.id,
        title: 'The Amber Throne',
        genre: 'Fantasy',
        synopsis: 'A disgraced cartographer discovers a hidden kingdom and must decide whether to restore its fallen dynasty or let it crumble into myth.',
        coverColor: '#5C2D1A',
      } as any),
    ) as unknown as Story;

    // Chapters + scenes
    const chapterData = [
      { title: 'The Cartographer\'s Map', position: 0, wordGoal: 2000 },
      { title: 'The Hidden Pass', position: 1, wordGoal: 2000 },
      { title: 'Embers of the Throne', position: 2, wordGoal: 2500 },
    ];
    const chapters: Chapter[] = [];
    for (const c of chapterData) {
      const chapter = await this.chaptersRepo.save(
        this.chaptersRepo.create({ ...c, storyId: story.id, status: 'draft' } as any),
      ) as unknown as Chapter;
      chapters.push(chapter);
    }

    const sceneTexts: Record<number, string[]> = {
      0: [
        'Kael unrolled the parchment across the tavern table, the edges curling like dry leaves. The ink had faded to a ghost of itself, but the mountains were unmistakable — a range that no map in the Guild archives had ever recorded.\n\n"Where did you find this?" he asked, not looking up.\n\n"Dead man\'s satchel," the innkeep said. "Paid his tab in silver, then died of nothing at all."',
        'The pass was real. Kael had spent three weeks in the saddle to prove it, and now the valley spread beneath him like a wound in the earth — green at the edges, black at the heart, and threaded through with a river that ran the color of old blood.',
      ],
      1: [
        'The guard at the pass did not carry a sword. She carried a ledger, and she asked Kael for his name, his business, and the name of the king he served.\n\n"I serve no king," Kael said.\n\n"Then you will not pass," she replied, "because the Amber Throne requires either a servant or a claimant."',
      ],
      2: [
        'The throne room was empty, but not abandoned. Dust lay thick on the marble, yet the great brazier at the room\'s heart burned with a flame that had no fuel — a column of amber light, steady as a heartbeat.\n\nKael touched the armrest of the throne. It was warm.',
      ],
    };

    for (let ci = 0; ci < chapters.length; ci++) {
      const texts = sceneTexts[ci] ?? [];
      for (let si = 0; si < texts.length; si++) {
        await this.scenesRepo.save(
          this.scenesRepo.create({
            chapterId: chapters[ci].id,
            title: `Scene ${si + 1}`,
            position: si,
            content: texts[si],
            wordCount: countWords(texts[si]),
          } as any),
        );
      }
    }

    // Characters
    const kael = await this.charactersRepo.save(
      this.charactersRepo.create({
        storyId: story.id,
        name: 'Kael Ashford',
        role: 'protagonist',
        age: 29,
        traits: 'stubborn, curious, loyal',
        appearance: 'Tall, with a scar across his left brow and hands stained permanently by ink.',
        backstory: 'Raised in the harbor district of Veyra. Expelled from the Cartographers\' Guild for drawing maps of places he had no right to know.',
        goals: 'Find the lost atlas of Veyra and restore the Amber Throne — or burn it for good.',
        avatarColor: '#8B5E3C',
      } as any),
    ) as unknown as Character;

    const sera = await this.charactersRepo.save(
      this.charactersRepo.create({
        storyId: story.id,
        name: 'Seraphine Vey',
        role: 'mentor',
        age: 64,
        traits: 'pragmatic, secretive, exacting',
        appearance: 'Small, silver-haired, always dressed in gray. Keeps a brass compass that never points north.',
        backstory: 'Last surviving archivist of the Amber Court. Knows where the throne\'s power comes from and why it must not wake.',
        goals: 'Keep the throne dormant, even if it means betraying Kael.',
        avatarColor: '#C4953C',
      } as any),
    ) as unknown as Character;

    await this.relationshipsRepo.save(
      this.relationshipsRepo.create({
        sourceCharacterId: kael.id,
        targetCharacterId: sera.id,
        type: 'mentor',
        description: 'Seraphine saved Kael from the Guild\'s executioners and taught him to read the old maps.',
      } as any),
    );

    // Locations
    const veyra = await this.locationsRepo.save(
      this.locationsRepo.create({
        storyId: story.id,
        name: 'Veyra',
        type: 'city',
        description: 'A harbor city of salt-stained stone and smuggler\'s alleys. Kael\'s home.',
        climate: 'Foggy winters, hot summers',
        population: 120000,
      } as any),
    ) as unknown as Location;

    const amberValley = await this.locationsRepo.save(
      this.locationsRepo.create({
        storyId: story.id,
        name: 'The Amber Valley',
        type: 'region',
        description: 'A hidden valley sealed by the mountain pass. The heart of the old kingdom.',
        climate: 'Mild, with amber-hued mists',
      } as any),
    ) as unknown as Location;

    await this.locationsRepo.save(
      this.locationsRepo.create({
        storyId: story.id,
        name: 'Throne Hall of Emberfell',
        type: 'building',
        parentId: amberValley.id,
        description: 'The ruined seat of the Amber Court, where a fire without fuel still burns.',
      } as any),
    );

    // Timeline events
    const ev1 = await this.eventsRepo.save(
      this.eventsRepo.create({
        storyId: story.id,
        title: 'Kael finds the impossible map',
        description: 'A dead courier\'s satchel yields a map of a mountain range that does not exist.',
        eventDate: 1,
        eventType: 'plot',
        importance: 4,
      } as any),
    ) as unknown as TimelineEvent;

    const ev2 = await this.eventsRepo.save(
      this.eventsRepo.create({
        storyId: story.id,
        title: 'Seraphine intervenes',
        description: 'The Guild sends executioners; Seraphine Vey buys Kael\'s life with a secret.',
        eventDate: 2,
        eventType: 'character',
        importance: 3,
      } as any),
    ) as unknown as TimelineEvent;

    const ev3 = await this.eventsRepo.save(
      this.eventsRepo.create({
        storyId: story.id,
        title: 'The Pass of the Ledger',
        description: 'Kael reaches the hidden pass and is stopped by a guard who serves no king.',
        eventDate: 3,
        eventType: 'plot',
        importance: 5,
      } as any),
    ) as unknown as TimelineEvent;

    // Link events to characters/locations
    ev1.characters = [kael];
    ev1.locations = [veyra];
    await this.eventsRepo.save(ev1);
    ev2.characters = [kael, sera];
    await this.eventsRepo.save(ev2);
    ev3.characters = [kael];
    ev3.locations = [amberValley];
    await this.eventsRepo.save(ev3);

    // Writing sessions
    const dates = ['2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31'];
    const words = [420, 610, 380, 520];
    for (let i = 0; i < dates.length; i++) {
      await this.sessionsRepo.save(
        this.sessionsRepo.create({
          userId: user.id,
          storyId: story.id,
          wordsWritten: words[i],
          durationMinutes: 30 + i * 10,
          notes: i === 3 ? 'Morning pages' : 'Evening draft',
          sessionDate: dates[i],
        } as any),
      );
    }

    this.logger.log('Seed complete: demo user quilldemo / demo1234');
  }
}
