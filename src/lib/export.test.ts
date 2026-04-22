import { describe, expect, it } from 'vitest';
import type { ThoughtEntry } from '@/types';
import type { JournalStats } from '@/hooks/use-cbt-journal';
import { generateFhirObservation } from './export';

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'fhir_latest_entry_value') return `Latest entry on ${options?.date}`;
  return key;
};

const entry = (overrides: Partial<ThoughtEntry> = {}): ThoughtEntry => ({
  id: 'entry-1',
  timestamp: Date.parse('2026-04-21T10:00:00.000Z'),
  date: '2026-04-21',
  level: 3,
  emotion: 'Triste',
  intensity: 4,
  note: 'Test note',
  tags: [],
  promptUsed: 'test',
  situation: 'Test situation',
  automaticThought: 'Test thought',
  alternativeResponse: 'Test response',
  originalIntensity: null,
  finalCredibility: null,
  ...overrides,
});

const stats = (overrides: Partial<JournalStats> = {}): JournalStats => ({
  total: 1,
  streak: 1,
  predominantLevel: '3',
  topEmotion: 'Triste',
  avgIntensity: 4,
  levelCount: { 1: 0, 2: 0, 3: 1 },
  emotionFreq: { Triste: 1 },
  tagFreq: {},
  avgICC: null,
  totalL3: 1,
  totalGoals: 0,
  completedGoals: 0,
  ...overrides,
});

describe('generateFhirObservation', () => {
  it('uses a local self-report code instead of a fake clinical LOINC code', () => {
    const observation = generateFhirObservation([entry()], stats(), t as never);

    expect(JSON.stringify(observation)).not.toContain('89123-7');
    expect(JSON.stringify(observation)).not.toContain('Normal');
    expect(observation?.code.coding[0]).toMatchObject({
      system: 'https://cognit.app/fhir/CodeSystem/self-report',
      code: 'cbt-journal-summary',
    });
    expect(observation).not.toHaveProperty('interpretation');
  });

  it('adds high-distress interpretation only when distress is elevated', () => {
    const observation = generateFhirObservation(
      [entry({ intensity: 9, originalIntensity: 9, finalCredibility: 3 })],
      stats({ avgIntensity: 8.5, avgICC: '0.60' }),
      t as never
    );

    expect(observation?.interpretation?.[0].coding[0].code).toBe('HH');
    expect(observation?.interpretation?.[0].text).toContain('self-reported distress');
    expect(observation?.note[0].text).toContain('not a diagnosis');
    expect(observation?.component.some((component) => component.code.text === 'Latest Cognitive Change Index (ICC)')).toBe(true);
  });

  it('omits ICC components when ICC values are unavailable instead of exporting zeroes', () => {
    const observation = generateFhirObservation([entry()], stats(), t as never);

    expect(observation?.component.some((component) => component.code.text.includes('ICC'))).toBe(false);
  });
});
