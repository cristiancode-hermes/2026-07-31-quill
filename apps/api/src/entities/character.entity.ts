import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Story } from './story.entity';
import { CharacterRelationship } from './character-relationship.entity';

@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'storyId', type: 'varchar' })
  storyId: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  role: string | null;

  @Column({ type: 'integer', nullable: true })
  age: number | null;

  @Column({ type: 'text', nullable: true })
  traits: string | null;

  @Column({ type: 'text', nullable: true })
  appearance: string | null;

  @Column({ type: 'text', nullable: true })
  backstory: string | null;

  @Column({ type: 'text', nullable: true })
  goals: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  avatarColor: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Story, (story: Story) => story.characters)
  @JoinColumn({ name: 'storyId' })
  story: Story;

  @OneToMany(
    () => CharacterRelationship,
    (rel: CharacterRelationship) => rel.sourceCharacter,
  )
  relationshipsAsSource: CharacterRelationship[];

  @OneToMany(
    () => CharacterRelationship,
    (rel: CharacterRelationship) => rel.targetCharacter,
  )
  relationshipsAsTarget: CharacterRelationship[];
}
