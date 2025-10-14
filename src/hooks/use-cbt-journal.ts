
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { setConfig, getConfig, setLastBackupDate, validateSchema } from '@/lib/db';
import type { ThoughtEntry, ThoughtEntryData, Achievement, CrisisContact, FilterState, CognitiveDistortion, FearItem, ExposureLog, ExposureState } from '@/types';
import { todayISO, calculateICC, normalizeText } from '@/lib/utils';
import { MIN_L3_RESPONSE_LENGTH, MIN_SESSIONS_FOR_ANALYSIS, RUMINATION_THRESHOLD, ROWS_PER_PAGE, BACKUP_REMINDER_DAYS } from '@/lib/constants';
import { detectCognitiveDistortions } from '@/lib/distortions';
import { useTranslation } from './use-translation';
import { getContextualPrompt } from '@/lib/prompts';
import { useVault, type VaultData } from '@/context/vault/VaultProvider';


// --- Stats Calculation ---
export interface JournalStats {
    total: number;
    streak: number;
    predominantLevel: string;
    topEmotion: string;

    avgIntensity: number;
    levelCount: Record<number, number>;
    emotionFreq: Record<string, number>;
    tagFreq: Record<string, number>;
    avgICC: string | null;
    totalL3: number;
}

export interface JournalAnalysis {
    triggers: { situation: string; count: number; avgIntensity: number }[];
    iccByEmotion: { emotion: string; avgICC: string; count: number }[];
    iccFeedback: string | null;
    compareLastDays: (days: number) => any;
    detectPatterns: () => any[];
    negativeStreak: number;
    distortionFreq: { name: string; count: number }[];
    insight: string | null;
}

export interface CrisisConfig {
    copingPhrase: string;
    contacts: CrisisContact[];
}

export interface PaginationState {
    currentPage: number;
    paginatedEntries: ThoughtEntry[];
    hasMore: boolean;
    totalFiltered: number;
}

const calculateStreak = (rows: ThoughtEntry[]): number => {
    if (rows.length === 0) return 0;
    const uniqueDates = [...new Set(rows.map(r => r.date))].sort().reverse();
    let streak = 0;
    const today = new Date(todayISO() + 'T00:00:00');
    
    // Find the first date to start counting from (today or yesterday)
    const startDateIndex = uniqueDates.findIndex(d => {
        const date = new Date(d + 'T00:00:00');
        const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
    });

    if (startDateIndex === -1) return 0; // No entries from today or yesterday

    streak = 1;
    let lastDate = new Date(uniqueDates[startDateIndex] + 'T00:00:00');

    for (let i = startDateIndex + 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i] + 'T00:00:00');
        const dayDiff = Math.round((lastDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
        if (dayDiff === 1) {
            streak++;
            lastDate = currentDate;
        } else {
            break;
        }
    }
    return streak;
};


const calculateStats = (rows: ThoughtEntry[], t: (key: string, options?: any) => any): JournalStats & { distortionFreq: {name: string, count: number}[] } => {
    const total = rows.length;
    
    const initialStats = {
      total: 0, streak: 0, predominantLevel: '-', topEmotion: '-',
      avgIntensity: 0, levelCount: {1:0, 2:0, 3:0}, emotionFreq: {}, tagFreq: {},
      avgICC: null, totalL3: 0, distortionFreq: {} as Record<string, number>
    };

    if (total === 0) {
        return {
            ...initialStats,
            distortionFreq: []
        };
    }

    let totalIntensity = 0;
    let totalICC = 0; 
    let iccCount = 0; 

    rows.forEach(r => {
      initialStats.levelCount[r.level] = (initialStats.levelCount[r.level] || 0) + 1;
      totalIntensity += (r.intensity || 5);
      if (r.emotion) initialStats.emotionFreq[r.emotion] = (initialStats.emotionFreq[r.emotion] || 0) + 1;
      if (r.tags) r.tags.forEach(t => initialStats.tagFreq[t] = (initialStats.tagFreq[t] || 0) + 1);
      
      if (r.level === 3 && !r.__draft) initialStats.totalL3++;

      const icc = calculateICC(r.originalIntensity, r.finalCredibility);
      if (icc !== null) {
          totalICC += parseFloat(icc);
          iccCount++;
      }
      
      if (r.automaticThought) {
        const detected = detectCognitiveDistortions(r.automaticThought, t);
        detected.forEach(d => {
            initialStats.distortionFreq[d.name] = (initialStats.distortionFreq[d.name] || 0) + 1;
        });
      }
    });

    const predominantLevel = Object.keys(initialStats.levelCount).sort((a, b) => initialStats.levelCount[parseInt(b)] - initialStats.levelCount[parseInt(a)])[0] || '-';
    const topEmotion = Object.keys(initialStats.emotionFreq).sort((a, b) => initialStats.emotionFreq[b] - initialStats.emotionFreq[a])[0] || '-';
    const avgIntensity = total > 0 ? parseFloat((totalIntensity / total).toFixed(1)) : 0;
    const streak = calculateStreak(rows);
    const avgICC = iccCount > 0 ? (totalICC / iccCount).toFixed(2) : null; 

    const sortedDistortions = Object.entries(initialStats.distortionFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return { 
        total, 
        streak, 
        predominantLevel, 
        topEmotion, 
        avgIntensity, 
        levelCount: initialStats.levelCount, 
        emotionFreq: initialStats.emotionFreq, 
        tagFreq: initialStats.tagFreq, 
        avgICC, 
        totalL3: initialStats.totalL3,
        distortionFreq: sortedDistortions
    };
};

// --- Analysis Functions ---
const analyzeTriggers = (rows: ThoughtEntry[]) => {
    const triggerData: Record<string, { count: number; totalIntensity: number }> = {};
    rows.filter(r => r.situation && r.situation.trim().length > 3).forEach(r => {
        const normalizedTrigger = r.situation.trim().toLowerCase();
        if (!triggerData[normalizedTrigger]) {
            triggerData[normalizedTrigger] = { count: 0, totalIntensity: 0 };
        }
        triggerData[normalizedTrigger].count++;
        triggerData[normalizedTrigger].totalIntensity += r.intensity;
    });

    return Object.entries(triggerData).map(([situation, data]) => ({
        situation,
        count: data.count,
        avgIntensity: parseFloat((data.totalIntensity / data.count).toFixed(1))
    })).sort((a, b) => b.avgIntensity - a.avgIntensity || b.count - a.count).slice(0, 5);
};

const analyzeICCByEmotion = (rows: ThoughtEntry[]) => {
    const iccByEmotion: Record<string, { totalICC: number; count: number }> = {};
    const l3RowsWithICC = rows.filter(r => r.level === 3 && !r.__draft && calculateICC(r.originalIntensity, r.finalCredibility) !== null);

    if (l3RowsWithICC.length < 5) return [];

    l3RowsWithICC.forEach(r => {
        const emotion = r.emotion || 'Sin Emoción';
        const icc = parseFloat(calculateICC(r.originalIntensity, r.finalCredibility)!);
        if (!iccByEmotion[emotion]) {
            iccByEmotion[emotion] = { totalICC: 0, count: 0 };
        }
        iccByEmotion[emotion].totalICC += icc;
        iccByEmotion[emotion].count++;
    });

    return Object.entries(iccByEmotion)
        .map(([emotion, data]) => ({
            emotion,
            avgICC: (data.totalICC / data.count).toFixed(2),
            count: data.count
        }))
        .filter(item => item.count >= 2)
        .sort((a, b) => parseFloat(b.avgICC) - parseFloat(a.avgICC));
};

const generateICCFeedback = (iccAnalysis: ReturnType<typeof analyzeICCByEmotion>, t: (key: string, options?: any) => string) => {
    if (iccAnalysis.length === 0) return null;
    const best = iccAnalysis[0];
    const worst = iccAnalysis[iccAnalysis.length - 1];
    let feedback = '';

    if (parseFloat(best.avgICC) >= 0.65) {
        feedback += t('feedback_icc_strong_point', { emotion: best.emotion, icc: best.avgICC });
    }
    if (worst && parseFloat(worst.avgICC) <= 0.35 && worst.emotion !== best.emotion) {
        if (feedback) feedback += '<br/><br/>';
        feedback += t('feedback_icc_improvement_point', { emotion: worst.emotion, icc: worst.avgICC });
    }
    return feedback || null;
};

const compareLastDays = (rows: ThoughtEntry[], days: number, t: (key: string, options?: any) => string) => {
    if (rows.length < 10) return { error: t('feedback_compare_insufficient_data_10') };
    const sorted = rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const today = new Date(todayISO());
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);

    const recentRows = sorted.filter(r => new Date(r.date) >= cutoffDate);
    const olderRows = sorted.filter(r => new Date(r.date) < cutoffDate);


    if (olderRows.length < 3 || recentRows.length < 3) {
         return { error: t('feedback_compare_insufficient_data_3', { days }) };
    }
    const olderStats = calculateStats(olderRows, t);
    const recentStats = calculateStats(recentRows, t);
    const deltaIntensity = parseFloat(recentStats.avgIntensity.toFixed(1)) - parseFloat(olderStats.avgIntensity.toFixed(1));
    const deltaSessions = recentStats.total - olderStats.total;
    
    let insight = '';
    if (deltaIntensity < -0.5) insight = t('feedback_compare_progress', { delta: Math.abs(deltaIntensity).toFixed(1) });
    else if (deltaIntensity > 0.5) insight = t('feedback_compare_increase', { delta: deltaIntensity.toFixed(1) });
    else insight = t('feedback_compare_stable');

    if (deltaSessions > 0) {
        insight += ` ${t('feedback_compare_more_sessions', { count: deltaSessions })}`;
    } else if (deltaSessions < 0) {
        insight += ` ${t('feedback_compare_less_sessions', { count: Math.abs(deltaSessions) })}`;
    }


    return { older: olderStats, recent: recentStats, deltaIntensity, insight };
};

const detectPatterns = (rows: ThoughtEntry[], stats: JournalStats, t: (key: string, options?: any) => string) => {
    const patterns = [];
    if (rows.length < MIN_SESSIONS_FOR_ANALYSIS) {
        return [{ text: t('feedback_patterns_insufficient_data', { min: MIN_SESSIONS_FOR_ANALYSIS }), type: 'warning' }];
    }
    // L3 stagnation
    const recentRows = rows.slice(0, 14);
    const recentNegative = recentRows.filter(r => ['Ansioso', 'Triste', 'Irritado', 'Cansado', 'Anxious', 'Sad', 'Irritated', 'Tired'].includes(r.emotion)).length;
    const recentL3 = recentRows.filter(r => r.level === 3 && !r.__draft).length;

    if (recentNegative >= 8 && recentL3 === 0) {
        patterns.push({
            text: t('feedback_patterns_rumination_risk', { count: recentNegative }),
            type: 'warning'
        });
    }

    // ICC Average
    if (stats.avgICC) {
        const avgICC = parseFloat(stats.avgICC);
        let iccMsg = '';
        let iccType = 'success';
        if (avgICC > 0.65) {
            iccMsg = t('feedback_patterns_icc_excellent', { icc: stats.avgICC });
        } else if (avgICC > 0.3) {
            iccMsg = t('feedback_patterns_icc_good', { icc: stats.avgICC });
            iccType = 'warning';
        } else {
            iccMsg = t('feedback_patterns_icc_low', { icc: stats.avgICC });
            iccType = 'warning';
        }
        patterns.push({ text: iccMsg.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'), type: iccType });
    }
    return patterns;
};

const analyzeNegativeStreak = (rows: ThoughtEntry[]): number => {
  const sorted = rows.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const uniqueDates = [...new Set(sorted.map(r => r.date))];

  let consecutiveDays = 0;
  let lastDate: Date | null = null;

  for (const dateStr of uniqueDates) {
      const entriesForDay = sorted.filter(r => r.date === dateStr);
      const hasHighIntensity = entriesForDay.some(e => e.intensity >= 6);
      const hasL3 = entriesForDay.some(e => e.level === 3 && !e.__draft);

      if (hasHighIntensity && !hasL3) {
          const currentDate = new Date(dateStr);
          if (lastDate === null || (lastDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24) === 1) {
              consecutiveDays++;
              lastDate = currentDate;
          } else {
              break; // Streak is broken
          }
      } else {
          break; // Streak is broken
      }
  }

  return consecutiveDays >= 5 ? consecutiveDays : 0;
};

const generateInsight = (stats: JournalStats, rows: ThoughtEntry[], t: (key: string, options?: any) => string): string | null => {
    if (stats.total === 0) return t('insight_start_logging');

    if (stats.streak > 0) {
        return t('insight_streak', { count: stats.streak });
    }
    
    if (stats.total > 1 && stats.streak === 0) {
        return t('insight_streak_broken');
    }
    
    if (stats.totalL3 > 5 && stats.avgICC) {
        const iccValue = parseFloat(stats.avgICC);
        if (iccValue < 0.35) {
            return t('insight_low_icc');
        }
    }
    
    return t('insight_keep_logging');
}


// --- Main Hook ---
export const useCbtJournal = () => {
    const { locked, getData, setData, wipe, isChangingPassword } = useVault();
    const { t, locale } = useTranslation();

    // These states hold the current session's data, derived from the vault
    const [allEntries, setAllEntries] = useState<ThoughtEntry[]>([]);
    const [stats, setStats] = useState<JournalStats>(calculateStats([], t));
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [crisisConfig, setCrisisConfig] = useState<CrisisConfig>({ copingPhrase: '', contacts: [] });
    const [exposureState, setExposureState] = useState<ExposureState>({ fearLadder: [], logs: [] });
    const [ruminationState, setRuminationState] = useState({ count: 0, isRuminationBlocked: false });
    const [lastPrompt, setLastPrompt] = useState('');
    const [showTour, setShowTour] = useState(false);
    
    // UI/Flow states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [crisisDetected, setCrisisDetected] = useState<boolean>(false);
    const [showBackupReminder, setShowBackupReminder] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterState>({
      level: 'all',
      text: '',
      dateMin: '',
      dateMax: todayISO(),
    });
    const [currentPage, setCurrentPage] = useState(1);
    
    const refreshJournal = useCallback(async (data: VaultData | null) => {
        if (!data) {
            setAllEntries([]);
            setExposureState({ fearLadder: [], logs: [] });
            setAchievements([]);
            setStats(calculateStats([], t));
            setIsLoading(false);
            setDbStatus('ok');
            return;
        };

        setIsLoading(true);
        setDbStatus('loading');
        try {
            const entriesFromDb = data.cbtEntries || [];
            const sortedEntries = [...entriesFromDb].sort((a: ThoughtEntry, b: ThoughtEntry) => b.timestamp - a.timestamp);
            setAllEntries(sortedEntries);
            
            const newStats = calculateStats(sortedEntries, t);
            setStats(newStats);

            const storedAchievements = data.achievements || [];
            setAchievements(storedAchievements);

            const config = data.config || {};
            const phrase = config.crisisConfig?.copingPhrase || t('default_coping_phrase');
            const contacts = config.crisisConfig?.contacts || [];
            setCrisisConfig({ copingPhrase: phrase, contacts });

            const lastPromptFromDB = config[`lastPrompt_${locale}`];
            setLastPrompt(lastPromptFromDB || getContextualPrompt(1, newStats, t));

            const exposureData = data.exposureState || { fearLadder: [], logs: [] };
            setExposureState(exposureData);
            
            const ruminationCount = config.ruminationCount || 0;
            setRuminationState({ count: ruminationCount, isRuminationBlocked: ruminationCount >= RUMINATION_THRESHOLD });
            
            const tourCompleted = config.tourCompleted;
            if (!tourCompleted && sortedEntries.length === 0) {
                setShowTour(true);
            }

            const lastBackupDateStr = await getConfig<string>('lastBackupDate'); // This can stay in un-encrypted storage
            if (lastBackupDateStr) {
                const lastBackupDate = new Date(lastBackupDateStr);
                const daysSinceBackup = (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 3600 * 24);
                if (daysSinceBackup > BACKUP_REMINDER_DAYS && sortedEntries.length > 0) {
                    setShowBackupReminder(true);
                }
            } else if (sortedEntries.length > 0) {
                 setShowBackupReminder(true);
            }

            setDbStatus('ok');

        } catch (error) {
            console.error("Failed to refresh journal from vault:", error);
            setDbStatus('error');
        } finally {
            setIsLoading(false);
        }
    }, [t, locale]);

    useEffect(() => {
        if (isChangingPassword) {
            setIsLoading(true);
            return;
        }
        if (!locked) {
            const vaultData = getData();
            refreshJournal(vaultData);
        } else {
            setIsLoading(false);
        }
    }, [isChangingPassword, locked, getData, refreshJournal]);


    const filteredEntries = useMemo(() => {
        return allEntries.filter(entry => {
            if (filters.level !== 'all' && String(entry.level) !== filters.level) return false;
            
            const searchText = filters.text.toLowerCase();
            if (searchText) {
                const searchable = [entry.note, entry.emotion, entry.situation, entry.automaticThought, entry.alternativeResponse, ...(entry.tags || [])].join(' ').toLowerCase();
                if (!searchable.includes(searchText)) return false;
            }
            if (filters.dateMin && entry.date < filters.dateMin) return false;
            if (filters.dateMax && entry.date > filters.dateMax) return false;

            return true;
        })
    }, [allEntries, filters]);
    
    useEffect(() => {
      setCurrentPage(1);
    }, [filters]);

    const pagination: PaginationState = useMemo(() => {
        const paginatedEntries = filteredEntries.slice(0, currentPage * ROWS_PER_PAGE);
        const hasMore = filteredEntries.length > paginatedEntries.length;
        return {
            currentPage,
            paginatedEntries,
            hasMore,
            totalFiltered: filteredEntries.length,
        };
    }, [filteredEntries, currentPage]);

    const loadMoreEntries = () => {
        setCurrentPage(prev => prev + 1);
    };

    const analysis: JournalAnalysis = useMemo(() => {
        const currentStats = calculateStats(allEntries, t);
        const iccByEmotion = analyzeICCByEmotion(allEntries);
        return {
            triggers: analyzeTriggers(allEntries),
            iccByEmotion,
            iccFeedback: generateICCFeedback(iccByEmotion, t),
            compareLastDays: (days: number) => compareLastDays(allEntries, days, t),
            detectPatterns: () => detectPatterns(allEntries, currentStats, t),
            negativeStreak: analyzeNegativeStreak(allEntries),
            distortionFreq: currentStats.distortionFreq,
            insight: generateInsight(currentStats, allEntries, t),
        }
    }, [allEntries, t]);

    const updateFullState = async (newData: VaultData) => {
        await setData(newData);
        await refreshJournal(newData);
    };

    const incrementRuminationCount = async () => {
        const currentData = getData() || {};
        const newCount = (currentData.config?.ruminationCount || 0) + 1;
        const newConfig = { ...currentData.config, ruminationCount: newCount };
        await setData({ ...currentData, config: newConfig });
        setRuminationState({ count: newCount, isRuminationBlocked: newCount >= RUMINATION_THRESHOLD });
        return newCount;
    };
    
    const resetRumination = async () => {
        const currentData = getData() || {};
        const newConfig = { ...currentData.config, ruminationCount: 0 };
        await setData({ ...currentData, config: newConfig });
        setRuminationState({ count: 0, isRuminationBlocked: false });
    };

    const completeTour = async () => {
        const currentData = getData() || {};
        const newConfig = { ...currentData.config, tourCompleted: true };
        await setData({ ...currentData, config: newConfig });
        setShowTour(false);
    };

    const addNewEntry = async (entryData: ThoughtEntryData) => {
        setIsSaving(true);
        let detectedDistortions: CognitiveDistortion[] = [];

        try {
            if (ruminationState.isRuminationBlocked) {
                throw new Error("Rumination threshold reached.");
            }

            const sanitizedEntryData: ThoughtEntryData = { ...entryData, note: entryData.note.trim() };

            let reclassifiedLevel: number | null = null;
            if (sanitizedEntryData.level === 3) {
                const isL2Complete = !!sanitizedEntryData.situation && !!sanitizedEntryData.automaticThought;
                const isL3Complete = isL2Complete && sanitizedEntryData.alternativeResponse.length >= MIN_L3_RESPONSE_LENGTH;

                if (!isL3Complete) {
                    reclassifiedLevel = isL2Complete ? 2 : 1;
                    sanitizedEntryData.level = reclassifiedLevel;
                    sanitizedEntryData.__draft = true;
                    const newCount = await incrementRuminationCount();
                    if (newCount >= RUMINATION_THRESHOLD) throw new Error("Rumination threshold reached.");
                } else {
                    await resetRumination();
                }
            }


            if (sanitizedEntryData.level === 3 && !sanitizedEntryData.__draft) {
                detectedDistortions = detectCognitiveDistortions(sanitizedEntryData.automaticThought, t);
            }
            
            const noteText = normalizeText(sanitizedEntryData.note) + ' ' + normalizeText(sanitizedEntryData.automaticThought);
            const isNegativeEmotion = ['ansioso', 'triste', 'irritado', 'cansado', 'anxious', 'sad', 'irritated', 'tired'].includes(normalizeText(sanitizedEntryData.emotion));
            const intensityTrigger = sanitizedEntryData.intensity >= 9 && isNegativeEmotion;
            
            const riskKeywords: string[] = t('risk_keywords') || [];
            const keywordTrigger = riskKeywords.some((keyword: string) => noteText.includes(normalizeText(keyword)));
            
            if(intensityTrigger || keywordTrigger) {
                setCrisisDetected(true);
                throw new Error("Crisis risk detected.");
            }

            const newEntry: ThoughtEntry = {
                ...sanitizedEntryData,
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                timestamp: Date.now(),
            };
            
            const currentData = getData() || { cbtEntries: [], achievements: [], config: {} };
            const newEntries = [newEntry, ...(currentData.cbtEntries || [])];
            
            const currentStats = calculateStats(newEntries, t);
            let newAchievements: Achievement[] = [];
            const currentAchievements = currentData.achievements || [];

            const achievementDefinitions: any[] = t('all_achievements_definitions') || [];
            for (const achDef of achievementDefinitions) {
                const isUnlocked = currentAchievements.some((a: Achievement) => a.id === achDef.id);
                
                let conditionMet = false;
                if (achDef.id === 'consistency_3d' && currentStats.streak >= 3) conditionMet = true;
                if (achDef.id === 'consistency_7d' && currentStats.streak >= 7) conditionMet = true;
                if (achDef.id === 'l3_first_use' && newEntries.some(r => r.level === 3 && !r.__draft)) conditionMet = true;
                if (achDef.id === 'emotion_spectrum' && Object.keys(currentStats.emotionFreq).length >= 5) conditionMet = true;
                if (achDef.id === 'first_cbt_cycle' && newEntries.some(r => !!(r.situation && r.automaticThought && r.alternativeResponse))) conditionMet = true;

                if (!isUnlocked && conditionMet) {
                    const unlockedAchievement: Achievement = { 
                        id: achDef.id, 
                        unlockedAt: new Date().toISOString(),
                        emoji: achDef.emoji,
                        name: achDef.name 
                    };
                    newAchievements.push(unlockedAchievement);
                }
            }

            const finalAchievements = [...currentAchievements, ...newAchievements];
            const newConfig = { ...currentData.config, [`lastPrompt_${locale}`]: sanitizedEntryData.promptUsed };

            await setData({ ...currentData, cbtEntries: newEntries, achievements: finalAchievements, config: newConfig });
            
            return { isDraft: !!newEntry.__draft, newAchievements, distortions: detectedDistortions, reclassifiedLevel };
        } finally {
            setIsSaving(false);
        }
    };

    const updateCrisisConfig = async (newConfig: Partial<CrisisConfig>) => {
        const currentData = getData() || {};
        const updatedConfig = { ...currentData.config, crisisConfig: { ...currentData.config?.crisisConfig, ...newConfig } };
        await setData({ ...currentData, config: updatedConfig });
    };

    const removeEntry = async (id: string) => {
        const currentData = getData() || {};
        const newEntries = (currentData.cbtEntries || []).filter((e: ThoughtEntry) => e.id !== id);
        await setData({ ...currentData, cbtEntries: newEntries });
    };

    const clearJournal = async () => {
        await wipe();
        await refreshJournal(null);
    };



    const importData = async (file: File): Promise<{success: boolean}> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target?.result as string);
                    if (!validateSchema(importedData)) throw new Error(t('error_invalid_import_file'));
                    const currentData = getData() || {};
                    await setData({ ...currentData, ...importedData });
                    await setLastBackupDate();
                    resolve({ success: true });
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    };
    
    const saveExposureState = async (newState: ExposureState) => {
        const currentData = getData() || {};
        await setData({ ...currentData, exposureState: newState });
    }
    
    const addFearItem = (item: Omit<FearItem, 'id' | 'completed'>) => {
        const newItem: FearItem = { ...item, id: Date.now().toString(), completed: false };
        const newLadder = [...exposureState.fearLadder, newItem].sort((a,b) => b.rating - a.rating);
        saveExposureState({ ...exposureState, fearLadder: newLadder });
    };

    const updateFearItem = (updatedItem: FearItem) => {
        const newLadder = exposureState.fearLadder.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => b.rating - a.rating);
        saveExposureState({ ...exposureState, fearLadder: newLadder });
    };

    const deleteFearItem = (id: string) => {
        const newLadder = exposureState.fearLadder.filter(item => item.id !== id);
        const newLogs = exposureState.logs.filter(log => log.fearItemId !== id);
        saveExposureState({ fearLadder: newLadder, logs: newLogs });
    };

    const addExposureLog = (log: Omit<ExposureLog, 'id' | 'date'>) => {
        const newLog: ExposureLog = { ...log, id: Date.now().toString(), date: new Date().toISOString() };
        const newLogs = [newLog, ...exposureState.logs];
        saveExposureState({ ...exposureState, logs: newLogs });
    };
    
    return {
        entries: allEntries,
        stats,
        achievements,
        isLoading,
        isSaving,
        dbStatus,
        analysis,
        crisisConfig,
        crisisDetected,
        showBackupReminder,
        setCrisisDetected,
        setShowBackupReminder,
        addNewEntry,
        removeEntry,
        clearJournal,
        importData,
        updateCrisisConfig,
        filters,
        setFilters,
        pagination,
        loadMoreEntries,
        lastPrompt,
        exposureState,
        addFearItem,
        updateFearItem,
        deleteFearItem,
        addExposureLog,
        ruminationState,
        resetRumination,
        showTour,
        completeTour,
    };
};

    

    