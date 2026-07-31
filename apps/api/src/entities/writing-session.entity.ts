import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Story } from './story.entity';

@Entity('writing_sessions')
export class WritingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId', type: 'varchar' })
  userId: string;

  @Column({ name: 'storyId', type: 'varchar', nullable: true })
  storyId: string | null;

  @Column({ name: 'wordsWritten', type: 'integer', nullable: false })
  wordsWritten: number;

  @Column({ name: 'durationMinutes', type: 'integer', nullable: false })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'sessionDate', type: 'date', default: () => "CURRENT_DATE" })
  sessionDate: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => User, (user: User) => user.writingSessions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Story, { nullable: true })
  @JoinColumn({ name: 'storyId' })
  story: Story | null;
}
