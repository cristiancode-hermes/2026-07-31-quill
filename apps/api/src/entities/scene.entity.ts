import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity('scenes')
export class Scene {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chapterId', type: 'varchar' })
  chapterId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'integer', nullable: false })
  position: number;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'integer', default: 0 })
  wordCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Chapter, (chapter: Chapter) => chapter.scenes)
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter;
}
