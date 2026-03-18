
import type { JournalStats } from "@/hooks/use-cbt-journal";
import type { TFunction } from "@/hooks/use-translation";
import type { ClinicalProfile } from "@/types";

export function getContextualPrompt(level: number, stats: JournalStats, t: TFunction, clinicalProfile?: ClinicalProfile): string {
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5;
    const profile = clinicalProfile || 'unspecified';
    
    // 1. Profile-specific prompts take priority when they exist
    const profileKey = `profile_prompts_${profile}_level_${level}`;
    const profilePrompts: string[] | undefined = t(profileKey);
    if (Array.isArray(profilePrompts) && profilePrompts.length > 0) {
        // 50% chance to use profile-specific prompt for variety
        if (Math.random() < 0.5) {
            return profilePrompts[Math.floor(Math.random() * profilePrompts.length)];
        }
    }

    // 2. Contextual triggers (priority order)
    if (stats.avgICC && parseFloat(stats.avgICC) < 0.35 && level === 3) {
        const contextualPrompts: string[] = t('contextual_prompts_low_icc');
        return contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    }
    
    if (stats.streak === 0 && stats.total > 1) {
         const contextualPrompts: string[] = t('contextual_prompts_streak_broken');
         return contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    }

    if (stats.avgIntensity > 7) {
        const contextualPrompts: string[] = t('contextual_prompts_high_intensity');
        return contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    }

    // 3. Default base/night prompts
    const promptSetKey = isNight ? 'night_prompts' : 'base_prompts';
    const basePromptsForLevel: string[] = t(`${promptSetKey}_level_${level}`) || t(`${promptSetKey}_level_1`);
    return basePromptsForLevel[Math.floor(Math.random() * basePromptsForLevel.length)];
}
