import { describe, expect, it } from 'vitest';
import { CURRENT_VAULT_SCHEMA_VERSION, normalizeVaultData } from './schema';

describe('normalizeVaultData', () => {
  it('migrates legacy plaintext shapes into the current encrypted vault schema', () => {
    const migrated = normalizeVaultData({
      cbtEntries: [{ id: 'entry-1' }],
      config: {
        crisisConfig: { copingPhrase: 'Respira', contacts: [] },
        lastPrompt: '',
        ruminationCount: 2,
      },
    });

    expect(migrated.schemaVersion).toBe(CURRENT_VAULT_SCHEMA_VERSION);
    expect(migrated.cbtEntries).toHaveLength(1);
    expect(migrated.drafts).toEqual({});
    expect(migrated.config.crisisConfig.copingPhrase).toBe('Respira');
    expect(migrated.config.ruminationCount).toBe(2);
    expect(migrated.exposureState).toEqual({ fearLadder: [], logs: [] });
    expect(migrated.activationState).toEqual({ values: [], activities: [] });
  });

  it('normalizes malformed optional collections instead of leaking undefined state', () => {
    const migrated = normalizeVaultData({
      cbtEntries: undefined,
      goals: undefined,
      gratitudeEntries: undefined,
      sleepEntries: undefined,
      drafts: {
        gratitude: ['uno', 'dos'],
      },
    });

    expect(migrated.cbtEntries).toEqual([]);
    expect(migrated.goals).toEqual([]);
    expect(migrated.gratitudeEntries).toEqual([]);
    expect(migrated.sleepEntries).toEqual([]);
    expect(migrated.drafts.gratitude).toEqual(['uno', 'dos']);
  });
});
