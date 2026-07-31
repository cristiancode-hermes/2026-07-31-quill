// ---------- Quill domain models ----------

export interface User {
  id: string;
  email: string;
  username: string;
  dailyWordGoal: number;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  genre: string | null;
  synopsis: string | null;
  coverColor: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoryStats {
  totalWords: number;
  chapterCount: number;
  sceneCount: number;
  characterCount: number;
  locationCount: number;
  eventCount: number;
  wordsPerChapter: { chapterId: string; title: string; words: number; position: number }[];
}

export interface StoryDetail extends Story {
  stats: StoryStats;
}

export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  position: number;
  wordGoal: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  sceneCount?: number;
  totalWords?: number;
  scenes?: Scene[];
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string | null;
  position: number;
  content: string;
  wordCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  role: string | null;
  age: number | null;
  traits: string | null;
  appearance: string | null;
  backstory: string | null;
  goals: string | null;
  avatarColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRelationship {
  id: string;
  type: string;
  description: string | null;
  direction: 'incoming' | 'outgoing';
  otherCharacter: Character;
}

export interface CharacterDetail extends Character {
  relationships: CharacterRelationship[];
}

export interface Location {
  id: string;
  storyId: string;
  parentId: string | null;
  name: string;
  type: string;
  description: string | null;
  climate: string | null;
  population: number | null;
  createdAt: string;
  updatedAt: string;
  children?: Location[];
}

export interface TimelineEvent {
  id: string;
  storyId: string;
  title: string;
  description: string;
  eventDate: number;
  eventType: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
  characters?: Character[];
  locations?: Location[];
}

export interface WritingSession {
  id: string;
  userId: string;
  storyId: string | null;
  wordsWritten: number;
  durationMinutes: number;
  notes: string | null;
  sessionDate: string;
  createdAt: string;
}

export interface DashboardStats {
  totalWords: number;
  todayWords: number;
  dailyGoal: number;
  streak: number;
  storyCount: number;
  characterCount: number;
  recentStories: Story[];
}

export interface WeeklyWords {
  date: string;
  words: number;
}
