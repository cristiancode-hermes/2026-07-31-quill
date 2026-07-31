import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';

@Entity('character_relationships')
export class CharacterRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sourceCharacterId', type: 'varchar' })
  sourceCharacterId: string;

  @Column({ name: 'targetCharacterId', type: 'varchar' })
  targetCharacterId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Character, (character: Character) => character.relationshipsAsSource)
  @JoinColumn({ name: 'sourceCharacterId' })
  sourceCharacter: Character;

  @ManyToOne(() => Character, (character: Character) => character.relationshipsAsTarget)
  @JoinColumn({ name: 'targetCharacterId' })
  targetCharacter: Character;
}
