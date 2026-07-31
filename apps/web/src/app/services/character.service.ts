import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Character, CharacterDetail, CharacterRelationship } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly api = '/api';

  readonly characters = signal<Character[]>([]);
  readonly currentCharacter = signal<CharacterDetail | null>(null);
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  async loadCharacters(storyId: string): Promise<Character[]> {
    this.isLoading.set(true);
    try {
      const characters = await firstValueFrom(this.http.get<Character[]>(`${this.api}/stories/${storyId}/characters`));
      this.characters.set(characters);
      return characters;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getCharacter(id: string): Promise<CharacterDetail> {
    const character = await firstValueFrom(this.http.get<CharacterDetail>(`${this.api}/characters/${id}`));
    this.currentCharacter.set(character);
    return character;
  }

  async createCharacter(storyId: string, data: Partial<Character>): Promise<Character> {
    const character = await firstValueFrom(this.http.post<Character>(`${this.api}/stories/${storyId}/characters`, data));
    this.characters.update(list => [...list, character]);
    return character;
  }

  async updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
    const character = await firstValueFrom(this.http.patch<Character>(`${this.api}/characters/${id}`, data));
    this.characters.update(list => list.map(c => c.id === id ? { ...c, ...character } : c));
    return character;
  }

  async deleteCharacter(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/characters/${id}`));
    this.characters.update(list => list.filter(c => c.id !== id));
  }

  async getRelationships(characterId: string): Promise<CharacterRelationship[]> {
    return firstValueFrom(this.http.get<CharacterRelationship[]>(`${this.api}/characters/${characterId}/relationships`));
  }

  async addRelationship(characterId: string, data: { targetCharacterId: string; type: string; description?: string }): Promise<CharacterRelationship> {
    return firstValueFrom(this.http.post<CharacterRelationship>(`${this.api}/characters/${characterId}/relationships`, data));
  }

  async removeRelationship(relationshipId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/relationships/${relationshipId}`));
  }
}
