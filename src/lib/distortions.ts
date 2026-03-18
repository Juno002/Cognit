
import type { CognitiveDistortion } from '@/types';
import type { TFunction } from '@/hooks/use-translation';
import type { ClinicalProfile } from '@/types';

// Distortions most associated with each clinical profile (ordered by clinical relevance)
const PROFILE_DISTORTION_PRIORITY: Record<string, string[]> = {
    anxiety: ['catastrophizing', 'fortune_telling', 'magnification', 'mind_reading', 'all_or_nothing'],
    depression: ['mental_filter', 'overgeneralization', 'personalization', 'should_statements', 'disqualifying_positive'],
    anger: ['personalization', 'labeling', 'blame', 'should_statements', 'mind_reading'],
    unspecified: [],
};

export function detectCognitiveDistortions(text: string, t: TFunction, clinicalProfile?: ClinicalProfile): CognitiveDistortion[] {
  if (!text || !t) return [];
  
  const lowerCaseText = text.toLowerCase();
  const detected: CognitiveDistortion[] = [];
  const detectedIds = new Set<string>();

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

  // Sort by clinical relevance to the user's profile
  if (clinicalProfile && clinicalProfile !== 'unspecified') {
    const priority = PROFILE_DISTORTION_PRIORITY[clinicalProfile] || [];
    detected.sort((a, b) => {
      const aIdx = priority.indexOf(a.id);
      const bIdx = priority.indexOf(b.id);
      // Items in the priority list come first; items not in the list go to the end
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }

  return detected;
}
