import { normalizeText } from './utils';

const LEGACY_NEGATIVE_EMOTIONS = [
  'ansioso',
  'triste',
  'irritado',
  'cansado',
  'anxious',
  'sad',
  'irritated',
  'tired',
];

export type CrisisRiskReason = 'keyword' | 'intensity' | null;

export interface CrisisRiskInput {
  note?: string | null;
  automaticThought?: string | null;
  situation?: string | null;
  emotion?: string | null;
  intensity?: number | null;
  riskKeywords?: string[];
  negativeEmotionLabels?: string[];
}

export interface CrisisRiskResult {
  risk: boolean;
  reason: CrisisRiskReason;
  matchedKeyword?: string;
}

export const detectCrisisRisk = ({
  note,
  automaticThought,
  situation,
  emotion,
  intensity,
  riskKeywords = [],
  negativeEmotionLabels = [],
}: CrisisRiskInput): CrisisRiskResult => {
  const normalizedText = [note, automaticThought, situation].map(normalizeText).join(' ');
  const normalizedKeywords = riskKeywords
    .map((keyword) => ({ raw: keyword, normalized: normalizeText(keyword).trim() }))
    .filter((keyword) => keyword.normalized.length >= 3);

  const keywordMatch = normalizedKeywords.find((keyword) => normalizedText.includes(keyword.normalized));
  if (keywordMatch) {
    return { risk: true, reason: 'keyword', matchedKeyword: keywordMatch.raw };
  }

  const negativeEmotionSet = new Set([
    ...LEGACY_NEGATIVE_EMOTIONS,
    ...negativeEmotionLabels.map(normalizeText),
  ]);
  const normalizedEmotion = normalizeText(emotion);
  const highIntensity = typeof intensity === 'number' && Number.isFinite(intensity) && intensity >= 9;

  if (highIntensity && negativeEmotionSet.has(normalizedEmotion)) {
    return { risk: true, reason: 'intensity' };
  }

  return { risk: false, reason: null };
};
