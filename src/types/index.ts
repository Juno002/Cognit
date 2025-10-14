
export interface ThoughtEntry {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  level: number; // 1, 2, or 3
  emotion: string;
  intensity: number; // 1-10
  note: string;
  tags: string[];
  promptUsed: string;
  situation: string;
  automaticThought: string;
  alternativeResponse: string;
  creativeLink?: string; // New field for L2
  originalIntensity?: number | null; // 1-10 for the automatic thought
  finalCredibility?: number | null; // 1-10 for the automatic thought after challenge
  __draft?: boolean; // To mark incomplete L3 entries
}

export type ThoughtEntryData = Omit<ThoughtEntry, 'id' | 'timestamp'>;

export type ThoughtEntryFormData = Partial<Omit<ThoughtEntryData, 'level'>>;


export interface Achievement {
  id: string;
  unlockedAt: string; // ISO Date string
  emoji: string;
  name: string;
}

export interface CrisisContact {
  id: string;
  name: string;
  phone: string;
}

export interface FilterState {
  level: string;
  text: string;
  dateMin: string;
  dateMax: string;
}

export interface CognitiveDistortion {
  id: string;
  name: string;
  description: string;
  example: string;
  keywords: string[];
}

// Types for Exposure Mode
export interface FearItem {
    id: string;
    description: string;
    rating: number; // 0-100 SUDS rating
    completed: boolean;
}

export interface ExposureLog {
    id: string;
    fearItemId: string;
    date: string; // ISO string
    initialAnxiety: number; // 0-100
    finalAnxiety: number; // 0-100
    durationMinutes: number;
    notes?: string;
}

export interface ExposureState {
    fearLadder: FearItem[];
    logs: ExposureLog[];
}
