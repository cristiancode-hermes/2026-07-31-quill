import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Story } from './story.entity';
import { WritingSession } from './writing-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @Column({ type: 'integer', default: 500 })
  dailyWordGoal: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => Story, (story: Story) => story.user)
  stories: Story[];

  @OneToMany(() => WritingSession, (session: WritingSession) => session.user)
  writingSessions: WritingSession[];
}
