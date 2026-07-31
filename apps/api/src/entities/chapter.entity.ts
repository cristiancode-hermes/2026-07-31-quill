import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Story } from './story.entity';
import { Scene } from './scene.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'storyId', type: 'varchar' })
  storyId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'integer', nullable: false })
  position: number;

  @Column({ type: 'integer', nullable: true })
  wordGoal: number | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Story, (story: Story) => story.chapters)
  @JoinColumn({ name: 'storyId' })
  story: Story;

  @OneToMany(() => Scene, (scene: Scene) => scene.chapter)
  scenes: Scene[];
}
