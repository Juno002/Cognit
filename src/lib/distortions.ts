
import type { CognitiveDistortion } from '@/types';
import type { TFunction } from '@/hooks/use-translation';

export function detectCognitiveDistortions(text: string, t: TFunction): CognitiveDistortion[] {
  if (!text || !t) return [];
  
  const lowerCaseText = text.toLowerCase();
  const detected: CognitiveDistortion[] = [];
  const detectedIds = new Set<string>();

  // Fallback to an empty array if t('distortions') is not an array
  const currentDistortions: CognitiveDistortion[] = Array.isArray(t('distortions')) ? t('distortions') : [];

  if (currentDistortions.length === 0) {
    return [];
  }

  for (const distortion of currentDistortions) {
    if (distortion.keywords) {
      for (const keyword of distortion.keywords) {
        if (lowerCaseText.includes(keyword.toLowerCase())) {
          if (!detectedIds.has(distortion.id)) {
            detected.push(distortion);
            detectedIds.add(distortion.id);
          }
          break; 
        }
      }
    }
  }

  return detected;
}
