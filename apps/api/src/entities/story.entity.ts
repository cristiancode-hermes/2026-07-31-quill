import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Chapter } from './chapter.entity';
import { Character } from './character.entity';
import { Location } from './location.entity';
import { TimelineEvent } from './timeline-event.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId', type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  genre: string | null;

  @Column({ type: 'text', nullable: true })
  synopsis: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  coverColor: string | null;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => User, (user: User) => user.stories)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Chapter, (chapter: Chapter) => chapter.story)
  chapters: Chapter[];

  @OneToMany(() => Character, (character: Character) => character.story)
  characters: Character[];

  @OneToMany(() => Location, (location: Location) => location.story)
  locations: Location[];

  @OneToMany(() => TimelineEvent, (event: TimelineEvent) => event.story)
  timelineEvents: TimelineEvent[];
}
