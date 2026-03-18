
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
  creativeLink?: string; // Field for L2
  friendResponse?: string; // Displacement: The Friend Technique
  evidenceFor?: string; // Restructuring: Evidence for
  evidenceAgainst?: string; // Restructuring: Evidence against
  originalIntensity?: number | null; // 1-10 for the automatic thought
  finalCredibility?: number | null; // 1-10 for the automatic thought after challenge
  __draft?: boolean; // To mark incomplete L3 entries
  linkedGoalId?: string; // Link to a SMART goal
  isMeditation?: boolean; // Marks meditation-generated entries
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

export interface CrisisConfig {
  copingPhrase: string;
  contacts: CrisisContact[];
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
    catastrophicPrediction?: string; // ERP Phase 2: predicted worst outcome
    realOutcome?: string; // ERP Phase 2: actual outcome
    safetyBehaviorsAvoided?: string; // ERP Phase 2: safety behaviors challenged
}

export interface ExposureState {
    fearLadder: FearItem[];
    logs: ExposureLog[];
}

// Types for Behavioral Activation
export interface ActivationValue {
    id: string;
    name: string;
    description: string;
}

export interface Subtask {
    id: string;
    name: string;
    completed: boolean;
    completedAt?: string; // YYYY-MM-DD
}

export interface ActivationActivity {
    id: string;
    name: string;
    valueId: string;
    pleasure: number; // 0-10
    mastery: number; // 0-10
    difficulty: number; // 1-10
    subtasks?: Subtask[];
}

export interface ActivationState {
    values: ActivationValue[];
    activities: ActivationActivity[];
}

// Types for SMART Goals
export interface Goal {
    id: string;
    title: string;
    description?: string;
    measurement: string;
    difficulty: number; // 1-10
    relevance?: string;
    targetDate: string; // ISO date string
    createdAt: string; // ISO date string
    progress: number; // 0-100
    priority: 'low' | 'medium' | 'high';
    status: 'in-progress' | 'completed' | 'overdue';
    cbtEntryId?: string; // Linked CBT journal entry
}

// Types for Wellness
export interface GratitudeEntry {
    id: string;
    date: string; // YYYY-MM-DD
    items: string[];
}

// Types for Sleep Diary (CBT-I)
export interface SleepEntry {
    id: string;
    date: string; // YYYY-MM-DD
    bedTime: string; // HH:mm
    wakeTime: string; // HH:mm
    latencyMin: number; // Minutes to fall asleep
    awakenings: number;
    awakeMinutes: number; // Total minutes awake during night
    sleepQuality: 1 | 2 | 3 | 4 | 5;
    notes?: string;
    // Calculated fields
    crossesMidnight?: boolean;
    timeInBedMin?: number;
    timeAsleepMin?: number;
    sleepEfficiencyPct?: number;
    // Metadata
    createdAt?: string;
    updatedAt?: string;
    linkedJournalEntryId?: string;
}

// Types for Onboarding Tours
export interface TourStep {
    id: string;
    targetSelector?: string;
    title: string;
    body: string;
    actionLabel?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    requireAction?: boolean;
    skippable?: boolean;
}

export interface Tour {
    id: string;
    steps: TourStep[];
    autoStart?: boolean;
}

export interface TourStepState {
    seen: boolean;
    completedAt?: string;
}

export interface TourState {
    [key: string]: TourStepState | boolean;
    journal: TourStepState | boolean;
    activation: TourStepState | boolean;
    goals: TourStepState | boolean;
    exposure: TourStepState | boolean;
    wellness: TourStepState | boolean;
}

export type ClinicalProfile = 'anxiety' | 'depression' | 'anger' | 'unspecified';
