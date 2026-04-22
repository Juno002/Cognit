import { describe, expect, it } from 'vitest';
import { detectCrisisRisk } from './crisis';

describe('detectCrisisRisk', () => {
  it('flags explicit risk keywords across note and automatic thought fields', () => {
    const result = detectCrisisRisk({
      note: 'Hoy no puedo mas',
      automaticThought: 'Quiero desaparecer',
      riskKeywords: ['desaparecer'],
    });

    expect(result).toEqual({
      risk: true,
      reason: 'keyword',
      matchedKeyword: 'desaparecer',
    });
  });

  it('flags very high distress when paired with a negative emotion label', () => {
    const result = detectCrisisRisk({
      note: 'Estoy muy activado',
      emotion: 'Agobiado',
      intensity: 9,
      negativeEmotionLabels: ['Agobiado'],
      riskKeywords: [],
    });

    expect(result.risk).toBe(true);
    expect(result.reason).toBe('intensity');
  });

  it('does not flag high intensity for non-negative emotions or empty keyword entries', () => {
    const result = detectCrisisRisk({
      note: 'Fue un dia intenso pero manejable',
      emotion: 'Calmado',
      intensity: 9,
      negativeEmotionLabels: ['Triste'],
      riskKeywords: ['', '  ', 'yo'],
    });

    expect(result).toEqual({ risk: false, reason: null });
  });
});
