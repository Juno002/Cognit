import { describe, expect, it } from 'vitest';
import type { Goal, ThoughtEntry } from '@/types';
import { todayISO } from './utils';
import { analyzeNegativeStreak, compareLastDays } from '@/hooks/use-cbt-journal';

const t = (key: string, options?: Record<string, unknown>) => {
  if (!options) return key;
  return `${key}:${JSON.stringify(options)}`;
};

const isoDaysAgo = (daysAgo: number) => {
  const date = new Date(`${todayISO()}T00:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const entry = (id: string, daysAgo: number, intensity: number, level = 1): ThoughtEntry => ({
  id,
  timestamp: Date.now() - daysAgo,
  date: isoDaysAgo(daysAgo),
  level,
  emotion: 'Triste',
  intensity,
  note: `entry ${id}`,
  tags: [],
  promptUsed: 'test',
  situation: '',
  automaticThought: '',
  alternativeResponse: '',
});

describe('journal analytics', () => {
  it('compares a recent window against the immediately previous window only', () => {
    const rows = [
      entry('recent-0', 0, 3),
      entry('recent-1', 1, 3),
      entry('recent-2', 2, 3),
      entry('previous-0', 3, 7),
      entry('previous-1', 4, 7),
      entry('previous-2', 5, 7),
      entry('stale-0', 20, 10),
      entry('stale-1', 21, 10),
      entry('stale-2', 22, 10),
      entry('stale-3', 23, 10),
    ];
    const originalOrder = rows.map((row) => row.id);

    const result = compareLastDays(rows, [] as Goal[], 3, t);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.recent.total).toBe(3);
    expect(result.older.total).toBe(3);
    expect(result.recent.avgIntensity).toBe(3);
    expect(result.older.avgIntensity).toBe(7);
    expect(result.deltaIntensity).toBe(-4);
    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });

  it('detects negative streaks without mutating the incoming entries array', () => {
    const rows = [
      entry('older', 5, 9),
      entry('today', 0, 8),
      entry('yesterday', 1, 7),
      entry('two-days', 2, 9),
      entry('three-days-l3', 3, 9, 3),
    ];
    const originalOrder = rows.map((row) => row.id);

    expect(analyzeNegativeStreak(rows)).toBe(3);
    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });
});
