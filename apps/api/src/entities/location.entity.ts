import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Story } from './story.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'storyId', type: 'varchar' })
  storyId: string;

  @Column({ name: 'parentId', type: 'varchar', nullable: true })
  parentId: string | null;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'region' })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  climate: string | null;

  @Column({ type: 'integer', nullable: true })
  population: number | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Story, (story: Story) => story.locations)
  @JoinColumn({ name: 'storyId' })
  story: Story;

  @ManyToOne(() => Location, (location: Location) => location.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Location | null;

  @OneToMany(() => Location, (location: Location) => location.parent)
  children: Location[];
}
