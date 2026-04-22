import type {
  Achievement,
  ActivationState,
  ClinicalProfile,
  CrisisConfig,
  ExposureState,
  Goal,
  GratitudeEntry,
  SleepEntry,
  TourState,
} from '@/types';

export const CURRENT_VAULT_SCHEMA_VERSION = 2;

export type ThoughtFormDraft = {
  form?: Record<string, unknown>;
  internal?: {
    arrowChain?: string[];
    isArrowComplete?: boolean;
  };
};

export type VaultDrafts = {
  thoughtForm?: ThoughtFormDraft;
  gratitude?: string[];
};

export type VaultData = {
  schemaVersion: number;
  cbtEntries: any[];
  exposureState: ExposureState;
  activationState: ActivationState;
  achievements: Achievement[];
  goals: Goal[];
  gratitudeEntries: GratitudeEntry[];
  sleepEntries: SleepEntry[];
  drafts: VaultDrafts;
  config: {
    [key: string]: any;
    crisisConfig: CrisisConfig;
    lastPrompt: string;
    ruminationCount: number;
    lastBackupAt?: string;
    tourCompleted?: boolean;
    tourState?: TourState;
    clinicalProfile?: ClinicalProfile;
    showTours?: boolean;
  };
};

const defaultTourState: TourState = {
  journal: { seen: false },
  activation: { seen: false },
  goals: { seen: false },
  exposure: { seen: false },
  wellness: { seen: false },
};

export const createDefaultVaultData = (defaultCopingPhrase = ''): VaultData => ({
  schemaVersion: CURRENT_VAULT_SCHEMA_VERSION,
  cbtEntries: [],
  exposureState: { fearLadder: [], logs: [] },
  activationState: { values: [], activities: [] },
  achievements: [],
  goals: [],
  gratitudeEntries: [],
  sleepEntries: [],
  drafts: {},
  config: {
    crisisConfig: { copingPhrase: defaultCopingPhrase, contacts: [] },
    lastPrompt: '',
    ruminationCount: 0,
    showTours: true,
    tourState: defaultTourState,
  },
});

export const normalizeVaultData = (input?: Partial<VaultData> | null, defaultCopingPhrase = ''): VaultData => {
  const fallback = createDefaultVaultData(defaultCopingPhrase);
  const raw = input ?? {};
  const rawConfig = (raw.config ?? {}) as Partial<VaultData['config']>;
  const rawDrafts = (raw.drafts && typeof raw.drafts === 'object' ? raw.drafts : {}) as VaultDrafts;

  return {
    schemaVersion: CURRENT_VAULT_SCHEMA_VERSION,
    cbtEntries: Array.isArray(raw.cbtEntries) ? raw.cbtEntries : fallback.cbtEntries,
    exposureState: raw.exposureState ?? fallback.exposureState,
    activationState: raw.activationState ?? fallback.activationState,
    achievements: Array.isArray(raw.achievements) ? raw.achievements : fallback.achievements,
    goals: Array.isArray(raw.goals) ? raw.goals : fallback.goals,
    gratitudeEntries: Array.isArray(raw.gratitudeEntries) ? raw.gratitudeEntries : fallback.gratitudeEntries,
    sleepEntries: Array.isArray(raw.sleepEntries) ? raw.sleepEntries : fallback.sleepEntries,
    drafts: {
      thoughtForm: rawDrafts.thoughtForm,
      gratitude: Array.isArray(rawDrafts.gratitude) ? rawDrafts.gratitude : undefined,
    },
    config: {
      ...fallback.config,
      ...rawConfig,
      crisisConfig: {
        ...fallback.config.crisisConfig,
        ...(rawConfig.crisisConfig ?? {}),
      },
      ruminationCount: typeof rawConfig.ruminationCount === 'number' ? rawConfig.ruminationCount : 0,
      showTours: rawConfig.showTours !== false,
      tourState: rawConfig.tourState ?? fallback.config.tourState,
    },
  };
};
