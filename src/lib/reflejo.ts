
import type { JournalStats, JournalAnalysis } from "@/hooks/use-cbt-journal";
import type { TFunction } from "@/hooks/use-translation";
import type { ClinicalProfile } from "@/types";

export type ReflejoMode = 'mentor' | 'observer' | 'anchor';

export interface ReflejoState {
    mode: ReflejoMode;
    message: string;
    color: string;
    animation: string;
}

export function getReflejoState(
    stats: JournalStats, 
    analysis: JournalAnalysis, 
    t: TFunction,
    context?: { intensity?: number; isSOS?: boolean; isRumination?: boolean; clinicalProfile?: ClinicalProfile }
): ReflejoState {
    const profile = context?.clinicalProfile || 'unspecified';

    // 1. ANCHOR MODE (Highest priority: Crisis, High Intensity, SOS, Low ICC)
    if (context?.isSOS || context?.isRumination || (context?.intensity && context.intensity >= 8) || (stats.avgICC && parseFloat(stats.avgICC) < 0.35)) {
        let messageKey = 'lambda_anchor_default';
        if (context?.isSOS) messageKey = 'lambda_anchor_sos';
        else if (context?.isRumination) messageKey = 'lambda_anchor_rumination';
        else if (context?.intensity && context.intensity >= 8) messageKey = `lambda_anchor_high_intensity_${profile}`;
        else messageKey = 'lambda_anchor_low_icc';

        // Fallback to generic if profile-specific key doesn't exist
        const message = t(messageKey) || t('lambda_anchor_high_intensity');

        return {
            mode: 'anchor',
            message,
            color: 'hsl(var(--lambda-anchor))',
            animation: 'pulse-slow'
        };
    }

    // 2. MENTOR MODE (Success: High ICC)
    if (stats.avgICC && parseFloat(stats.avgICC) > 0.65) {
        const profileKey = `lambda_mentor_${profile}`;
        const message = t(profileKey) || t('lambda_mentor_default');
        return {
            mode: 'mentor',
            message,
            color: 'hsl(var(--lambda-mentor))',
            animation: 'float'
        };
    }

    // 3. OBSERVER MODE (Default, Negative Streak)
    let messageKey = `lambda_observer_${profile}`;
    if (analysis.negativeStreak > 3) {
        messageKey = `lambda_observer_negative_streak_${profile}`;
    }
    const message = t(messageKey) || t(analysis.negativeStreak > 3 ? 'lambda_observer_negative_streak' : 'lambda_observer_default');

    return {
        mode: 'observer',
        message,
        color: 'hsl(var(--lambda-observer))',
        animation: 'neutral'
    };
}

export function getReflejoContextualState(
    entry: any,
    allEntries: any[],
    t: TFunction,
    clinicalProfile?: ClinicalProfile
): ReflejoState | null {
    const profile = clinicalProfile || 'unspecified';
    
    // Helper to calculate ICC localmente
    const calculateLocalICC = (orig?: number | null, final?: number | null) => {
        if (typeof orig !== 'number' || typeof final !== 'number' || orig === null || final === null) return null;
        return (orig - final) / 10;
    };

    const entryICC = calculateLocalICC(entry.originalIntensity, entry.finalCredibility);

    // 1. ICC < 0.35 (Ancla)
    if (entry.level === 3 && entryICC !== null && entryICC < 0.35) {
        return {
            mode: 'anchor',
            message: t('lambda_contextual_low_icc'),
            color: 'hsl(var(--lambda-anchor))',
            animation: 'pulse-slow'
        };
    }

    // 2. Intensidad >= 7 (Ancla)
    if (entry.intensity >= 7) {
        return {
            mode: 'anchor',
            message: t(`lambda_anchor_high_intensity_${profile}`) || t('lambda_anchor_high_intensity'),
            color: 'hsl(var(--lambda-anchor))',
            animation: 'pulse-slow'
        };
    }

    // 3. Primer registro del día (Mentor)
    const sameDayEntries = allEntries.filter(e => e.date === entry.date);
    const sortedSameDay = [...sameDayEntries].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (sortedSameDay.length > 0 && sortedSameDay[0].id === entry.id) {
        return {
            mode: 'mentor',
            message: t('lambda_contextual_first_of_day'),
            color: 'hsl(var(--lambda-mentor))',
            animation: 'float'
        };
    }

    // 4. Distorsión recurrente (Observador)
    if (entry.tags && entry.tags.length > 0) {
        const currentIndex = allEntries.findIndex(e => e.id === entry.id);
        if (currentIndex !== -1) {
            const previousEntries = allEntries.slice(currentIndex + 1, currentIndex + 4);
            const commonDist = previousEntries.some(prev => 
                prev.tags && prev.tags.some((tag: string) => entry.tags.includes(tag))
            );
            if (commonDist) {
                return {
                    mode: 'observer',
                    message: t('lambda_contextual_recurring_distortion'),
                    color: 'hsl(var(--lambda-observer))',
                    animation: 'neutral'
                };
            }
        }
    }

    return null;
}
