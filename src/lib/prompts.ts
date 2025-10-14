
import type { JournalStats } from "@/hooks/use-cbt-journal";
import type { TFunction } from "@/hooks/use-translation";

export function getContextualPrompt(level: number, stats: JournalStats, t: TFunction): string {
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5; // From 8 PM to 5 AM
    
    const promptSetKey = isNight ? 'night_prompts' : 'base_prompts';
    const basePromptsForLevel: string[] = t(`${promptSetKey}_level_${level}`) || t(`${promptSetKey}_level_1`);
    
    // Check for contextual triggers (priority order)
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

    // Default to random prompt if no context matches
    return basePromptsForLevel[Math.floor(Math.random() * basePromptsForLevel.length)];
}
