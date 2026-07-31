import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, JoinColumn, JoinTable,
} from 'typeorm';
import { Story } from './story.entity';
import { Character } from './character.entity';
import { Location } from './location.entity';

@Entity('timeline_events')
export class TimelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'storyId', type: 'varchar' })
  storyId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ name: 'eventDate', type: 'integer', nullable: false })
  eventDate: number;

  @Column({ type: 'varchar', length: 30, default: 'plot' })
  eventType: string;

  @Column({ type: 'integer', default: 1 })
  importance: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Story, (story: Story) => story.timelineEvents)
  @JoinColumn({ name: 'storyId' })
  story: Story;

  @ManyToMany(() => Character)
  @JoinTable({
    name: 'timeline_event_characters',
    joinColumn: { name: 'timelineEventId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'characterId', referencedColumnName: 'id' },
  })
  characters: Character[];

  @ManyToMany(() => Location)
  @JoinTable({
    name: 'timeline_event_locations',
    joinColumn: { name: 'timelineEventId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'locationId', referencedColumnName: 'id' },
  })
  locations: Location[];
}
