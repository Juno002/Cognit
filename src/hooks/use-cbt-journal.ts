

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ThoughtEntry, ThoughtEntryData, Achievement, CrisisConfig, FilterState, CognitiveDistortion, FearItem, ExposureLog, ExposureState, ActivationState, ActivationValue, ActivationActivity, Subtask, Goal, GratitudeEntry, SleepEntry, TourState, ClinicalProfile } from '@/types';
import { todayISO, calculateICC } from '@/lib/utils';
import { MIN_L3_RESPONSE_LENGTH, MIN_SESSIONS_FOR_ANALYSIS, RUMINATION_THRESHOLD, ROWS_PER_PAGE, BACKUP_REMINDER_DAYS } from '@/lib/constants';
import { detectCognitiveDistortions } from '@/lib/distortions';
import { useTranslation } from './use-translation';
import { getContextualPrompt } from '@/lib/prompts';
import { useVault, type ThoughtFormDraft, type VaultData, type VaultDrafts } from '@/context/vault/VaultProvider';
import { useToast } from './use-toast';
import { createCognitBackupEnvelope, isCognitBackupEnvelope, readCognitBackupPayload } from '@/lib/backup';
import { detectCrisisRisk } from '@/lib/crisis';


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
    
    totalGoals: number;
    completedGoals: number;
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
    pleasureMasteryBalance: { totalActivities: number; avgPleasure: number; avgMastery: number; insight: string | null; };
    virtuousCircle: { date: string; mood: number | null; sleep: number | null; activity: number; }[];
}

export type TourSection = 'journal' | 'activation' | 'goals' | 'exposure' | 'wellness';

export type AddEntryResult =
    | { status: 'saved'; isDraft: boolean; entryId: string; newAchievements: Achievement[]; distortions: CognitiveDistortion[]; reclassifiedLevel: number | null }
    | { status: 'crisis_detected' }
    | { status: 'rumination_blocked' }
    | { status: 'validation_error'; message: string };

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


const calculateStats = (rows: ThoughtEntry[], goals: Goal[], t: (key: string, options?: any) => any, clinicalProfile?: ClinicalProfile): JournalStats & { distortionFreq: {name: string, count: number}[] } => {
    const total = rows.length;
    
    const initialStats = {
      total: total, streak: 0, predominantLevel: '-', topEmotion: '-',
      avgIntensity: 0, levelCount: {1:0, 2:0, 3:0} as Record<number, number>, emotionFreq: {} as Record<string, number>, tagFreq: {} as Record<string, number>,
      avgICC: null as string | null, totalL3: 0, distortionFreq: {} as Record<string, number>,
      totalGoals: 0, completedGoals: 0,
    };

    if (total === 0 && goals.length === 0) {
        return {
            ...initialStats,
            distortionFreq: []
        };
    }
    
    // Goal stats
    initialStats.totalGoals = goals.length;
    initialStats.completedGoals = goals.filter(g => g.status === 'completed').length;

    if (total > 0) {
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
          const detected = detectCognitiveDistortions(r.automaticThought, t, clinicalProfile);
          detected.forEach(d => {
              initialStats.distortionFreq[d.name] = (initialStats.distortionFreq[d.name] || 0) + 1;
          });
        }
      });

      initialStats.predominantLevel = Object.keys(initialStats.levelCount).sort((a, b) => initialStats.levelCount[parseInt(b)] - initialStats.levelCount[parseInt(a)])[0] || '-';
      initialStats.topEmotion = Object.keys(initialStats.emotionFreq).sort((a, b) => initialStats.emotionFreq[b] - initialStats.emotionFreq[a])[0] || '-';
      initialStats.avgIntensity = total > 0 ? parseFloat((totalIntensity / total).toFixed(1)) : 0;
      initialStats.streak = calculateStreak(rows);
      initialStats.avgICC = iccCount > 0 ? (totalICC / iccCount).toFixed(2) : null; 
    }

    const sortedDistortions = Object.entries(initialStats.distortionFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return { 
        ...initialStats,
        distortionFreq: sortedDistortions,
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
        if (feedback) feedback += '\n\n';
        feedback += t('feedback_icc_improvement_point', { emotion: worst.emotion, icc: worst.avgICC });
    }
    return feedback || null;
};

export const compareLastDays = (rows: ThoughtEntry[], goals: Goal[], days: number, t: (key: string, options?: any) => string) => {
    if (rows.length < 10) return { error: t('feedback_compare_insufficient_data_10') };
    const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const today = new Date(todayISO());
    const recentStart = new Date(today);
    recentStart.setDate(today.getDate() - days + 1);
    const previousStart = new Date(recentStart);
    previousStart.setDate(recentStart.getDate() - days);

    const recentRows = sorted.filter(r => {
        const date = new Date(r.date);
        return date >= recentStart && date <= today;
    });
    const olderRows = sorted.filter(r => {
        const date = new Date(r.date);
        return date >= previousStart && date < recentStart;
    });


    if (olderRows.length < 3 || recentRows.length < 3) {
         return { error: t('feedback_compare_insufficient_data_3', { days }) };
    }
    const olderStats = calculateStats(olderRows, goals, t);
    const recentStats = calculateStats(recentRows, goals, t);
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
    
    // Check against localized negative emotions + legacy strings to preserve historical backwards compatibility
    const allEmotions = (t('emotions') as unknown as {emoji: string, label: string}[]) || [];
    const negativeEmotionsLabels = allEmotions.filter((_, i) => [1, 3, 4, 6].includes(i)).map(e => e.label);
    const legacyNegative = ['Ansioso', 'Triste', 'Irritado', 'Cansado', 'Anxious', 'Sad', 'Irritated', 'Tired'];
    const negativeSet = new Set([...negativeEmotionsLabels, ...legacyNegative]);
    
    const recentNegative = recentRows.filter(r => negativeSet.has(r.emotion)).length;
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
        patterns.push({ text: iccMsg, type: iccType });
    }
    return patterns;
};

export const analyzeNegativeStreak = (rows: ThoughtEntry[]): number => {
  const sorted = [...rows].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const uniqueDates = [...new Set(sorted.map(r => r.date))];

  let consecutiveDays = 0;
  let lastDate: Date | null = null;

  for (const dateStr of uniqueDates) {
      const entriesForDay = sorted.filter(r => r.date === dateStr);
      const hasHighIntensity = entriesForDay.some(e => e.intensity >= 7);
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

  return consecutiveDays >= 3 ? consecutiveDays : 0;
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
};

const analyzePleasureMasteryBalance = (activities: ActivationActivity[], t: (key: string) => string) => {
    if (!activities || activities.length === 0) {
        return { totalActivities: 0, avgPleasure: 0, avgMastery: 0, insight: null };
    }
    const totalPleasure = activities.reduce((sum, act) => sum + act.pleasure, 0);
    const totalMastery = activities.reduce((sum, act) => sum + act.mastery, 0);
    const avgPleasure = parseFloat((totalPleasure / activities.length).toFixed(1));
    const avgMastery = parseFloat((totalMastery / activities.length).toFixed(1));

    let insight: string | null = null;
    if (avgPleasure > avgMastery + 2) {
        insight = t('pleasure_mastery_insight_pleasure');
    } else if (avgMastery > avgPleasure + 2) {
        insight = t('pleasure_mastery_insight_mastery');
    } else {
        insight = t('pleasure_mastery_insight_balance');
    }

    return { totalActivities: activities.length, avgPleasure, avgMastery, insight };
};

const getGoalStatus = (goal: Partial<Goal>): Goal['status'] => {
    const today = new Date(todayISO());
    today.setHours(0, 0, 0, 0); // Normalize today's date
    if (goal.progress === 100) return "completed";
    
    const targetDate = new Date(goal.targetDate || '');
    targetDate.setHours(0, 0, 0, 0); // Normalize target date
    
    if (targetDate < today) return "overdue";

    return "in-progress";
};

// --- Main Hook State ---
const useCbtJournalState = () => {
    const { t, locale } = useTranslation();
    const vault = useVault();
    const { toast } = useToast();

    // These states hold the current session's data
    const [allEntries, setAllEntries] = useState<ThoughtEntry[]>([]);
    const [stats, setStats] = useState<JournalStats>(calculateStats([], [], t, undefined));
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [crisisConfig, setCrisisConfig] = useState<CrisisConfig>({ copingPhrase: '', contacts: [] });
    const [exposureState, setExposureState] = useState<ExposureState>({ fearLadder: [], logs: [] });
    const [activationState, setActivationState] = useState<ActivationState>({ values: [], activities: [] });
    const [goals, setGoals] = useState<Goal[]>([]);
    const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
    const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
    const [drafts, setDrafts] = useState<VaultDrafts>({});
    const [ruminationState, setRuminationState] = useState({ count: 0, isRuminationBlocked: false });
    const [lastPrompt, setLastPrompt] = useState('');
    const [tourState, setTourState] = useState<TourState | undefined>(undefined);
    const [showTours, setShowToursState] = useState<boolean>(true);
    const [clinicalProfile, setClinicalProfileState] = useState<ClinicalProfile | undefined>(undefined);
    
    // UI/Flow states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [crisisDetected, setCrisisDetected] = useState<boolean>(false);
    const [showBackupReminder, setShowBackupReminder] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterState>({
      level: 'all',
      text: '',
      dateMin: '',
      dateMax: todayISO(),
    });
    const [currentPage, setCurrentPage] = useState(1);

    const refreshJournal = useCallback(() => {
        setIsLoading(true);
        try {
            const data: VaultData | null = vault.getData();
            if (!data) {
                // Initialize default state if no data found
                setAllEntries([]);
                setExposureState({ fearLadder: [], logs: [] });
                setActivationState({ values: [], activities: [] });
                setGoals([]);
                setGratitudeEntries([]);
                setSleepEntries([]);
                setDrafts({});
                setAchievements([]);
                setCrisisConfig({ copingPhrase: t('default_coping_phrase'), contacts: [] });
                setTourState({ journal: { seen: false }, activation: { seen: false }, goals: { seen: false }, exposure: { seen: false }, wellness: { seen: false }});
                setStats(calculateStats([], [], t));
            } else {
                const entriesFromDb = data.cbtEntries || [];
                const sortedEntries = [...entriesFromDb].sort((a: ThoughtEntry, b: ThoughtEntry) => b.timestamp - a.timestamp);
                setAllEntries(sortedEntries);
                
                const goalsData = (data.goals || []).map(g => ({ ...g, status: getGoalStatus(g) }));
                setGoals(goalsData);
                
                const config = data.config || {};
                const currentProfile = config.clinicalProfile;
                setClinicalProfileState(currentProfile);

                const newStats = calculateStats(sortedEntries, goalsData, t, currentProfile);
                setStats(newStats);

                const storedAchievements = data.achievements || [];
                setAchievements(storedAchievements);

                const phrase = config.crisisConfig?.copingPhrase || t('default_coping_phrase');
                const contacts = config.crisisConfig?.contacts || [];
                setCrisisConfig({ copingPhrase: phrase, contacts });

                const lastPromptFromDB = config[`lastPrompt_${locale}`];
                setLastPrompt(lastPromptFromDB || getContextualPrompt(1, newStats, t, currentProfile));

                const exposureData = data.exposureState || { fearLadder: [], logs: [] };
                setExposureState(exposureData);
                
                const activationData = data.activationState || { values: [], activities: [] };
                setActivationState(activationData);

                const gratitudeData = data.gratitudeEntries || [];
                setGratitudeEntries(gratitudeData);

                const sleepData = data.sleepEntries || [];
                setSleepEntries(sleepData);

                setDrafts(data.drafts || {});

                const ruminationCount = config.ruminationCount || 0;
                setRuminationState({ count: ruminationCount, isRuminationBlocked: ruminationCount >= RUMINATION_THRESHOLD });
                
                const initialTourState = { journal: { seen: false }, activation: { seen: false }, goals: { seen: false }, exposure: { seen: false }, wellness: { seen: false }};
                setTourState(config.tourState || initialTourState);
                setShowToursState(config.showTours !== false);
                setClinicalProfileState(config.clinicalProfile);

                // Backup reminder logic
                const lastBackupDateStr = config.lastBackupAt;
                if (lastBackupDateStr) {
                    const lastBackupDate = new Date(lastBackupDateStr);
                    const daysSinceBackup = (new Date().getTime() - lastBackupDate.getTime()) / (1000 * 3600 * 24);
                    if (daysSinceBackup > BACKUP_REMINDER_DAYS && sortedEntries.length > 0) {
                        setShowBackupReminder(true);
                    }
                } else if (sortedEntries.length > 0) {
                     setShowBackupReminder(true);
                }
            }
        } catch (error) {
            console.error("Failed to load journal from vault:", error);
        } finally {
            setIsLoading(false);
        }
    }, [t, locale, vault]);

    useEffect(() => {
        if (!vault.locked) {
            refreshJournal();
        }
    }, [vault.locked, refreshJournal]);
    
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
        const currentStats = calculateStats(allEntries, goals, t, clinicalProfile);
        const iccByEmotion = analyzeICCByEmotion(allEntries);
        return {
            triggers: analyzeTriggers(allEntries),
            iccByEmotion,
            iccFeedback: generateICCFeedback(iccByEmotion, t),
            compareLastDays: (days: number) => compareLastDays(allEntries, goals, days, t),
            detectPatterns: () => detectPatterns(allEntries, currentStats, t),
            negativeStreak: analyzeNegativeStreak(allEntries),
            distortionFreq: currentStats.distortionFreq,
            insight: generateInsight(currentStats, allEntries, t),
            pleasureMasteryBalance: analyzePleasureMasteryBalance(activationState.activities, t),
            virtuousCircle: (() => {
                const entriesByDate: Record<string, ThoughtEntry[]> = {};
                allEntries.forEach(e => {
                    if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
                    entriesByDate[e.date].push(e);
                });
                
                const completedSubtasksByDate: Record<string, number> = {};
                activationState.activities.forEach(act => {
                    (act.subtasks || []).forEach(st => {
                        if (st.completed && st.completedAt) {
                            completedSubtasksByDate[st.completedAt] = (completedSubtasksByDate[st.completedAt] || 0) + 1;
                        }
                    });
                });

                const data = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    
                    const dayEntries = entriesByDate[dateStr] || [];
                    const avgIntensity = dayEntries.length > 0 
                        ? dayEntries.reduce((sum, e) => sum + e.intensity, 0) / dayEntries.length 
                        : null;
                        
                    const sleepEntry = sleepEntries.find(s => s.date === dateStr);
                    const sleepEfficiency = sleepEntry?.sleepEfficiencyPct || null;
                    
                    const subtasksToday = completedSubtasksByDate[dateStr] || 0;
                    
                    data.push({
                        date: dateStr.slice(5).replace('-', '/'),
                        mood: avgIntensity,
                        sleep: sleepEfficiency,
                        activity: subtasksToday
                    });
                }
                return data.reverse();
            })(),
        }
    }, [allEntries, goals, activationState.activities, sleepEntries, clinicalProfile, t]);
    
    const updateFullState = async (newData: Partial<VaultData>) => {
        const currentData = vault.getData() || {} as VaultData;
        const finalData = { ...currentData, ...newData };
        
        // Recalculate goal statuses before saving
        if (finalData.goals) {
            finalData.goals = finalData.goals.map(g => ({ ...g, status: getGoalStatus(g) }));
        }

        await vault.setData(finalData);
        refreshJournal();
    };

    const updateDrafts = useCallback(async (nextDrafts: VaultDrafts) => {
        const currentData = vault.getData();
        if (!currentData) return;

        const updatedData = { ...currentData, drafts: nextDrafts };
        await vault.setData(updatedData);
        setDrafts(nextDrafts);
    }, [vault]);

    const saveThoughtFormDraft = useCallback(async (draftPatch: ThoughtFormDraft) => {
        const currentDrafts = vault.getData()?.drafts || drafts;
        const nextDrafts = {
            ...currentDrafts,
            thoughtForm: {
                ...(currentDrafts.thoughtForm || {}),
                ...draftPatch,
            },
        };
        await updateDrafts(nextDrafts);
    }, [drafts, updateDrafts, vault]);

    const clearThoughtFormDraft = useCallback(async () => {
        const currentDrafts = vault.getData()?.drafts || drafts;
        const remainingDrafts = { ...currentDrafts };
        delete remainingDrafts.thoughtForm;
        await updateDrafts(remainingDrafts);
    }, [drafts, updateDrafts, vault]);

    const saveGratitudeDraft = useCallback(async (items: string[]) => {
        const currentDrafts = vault.getData()?.drafts || drafts;
        await updateDrafts({ ...currentDrafts, gratitude: items });
    }, [drafts, updateDrafts, vault]);

    const clearGratitudeDraft = useCallback(async () => {
        const currentDrafts = vault.getData()?.drafts || drafts;
        const remainingDrafts = { ...currentDrafts };
        delete remainingDrafts.gratitude;
        await updateDrafts(remainingDrafts);
    }, [drafts, updateDrafts, vault]);

    const markBackupCreated = useCallback(async () => {
        const currentData = vault.getData();
        if (!currentData) return;

        const updatedConfig = { ...currentData.config, lastBackupAt: new Date().toISOString() };
        await vault.setData({ ...currentData, config: updatedConfig });
        setShowBackupReminder(false);
    }, [vault]);

    const exportEncryptedBackup = useCallback(async () => {
        const encryptedPackage = vault.getEncryptedPackage();
        if (!encryptedPackage) {
            throw new Error(t('toast_no_data_to_export_title'));
        }

        const envelope = await createCognitBackupEnvelope(encryptedPackage);
        return JSON.stringify(envelope, null, 2);
    }, [t, vault]);

    const incrementRuminationCount = async () => {
        const currentData = vault.getData() || {} as VaultData;
        const newCount = (currentData.config?.ruminationCount || 0) + 1;
        const newConfig = { ...currentData.config, ruminationCount: newCount };
        await vault.setData({ ...currentData, config: newConfig });
        setRuminationState({ count: newCount, isRuminationBlocked: newCount >= RUMINATION_THRESHOLD });
        return newCount;
    };
    
    const resetRumination = async () => {
        const currentData = vault.getData() || {} as VaultData;
        const newConfig = { ...currentData.config, ruminationCount: 0 };
        await vault.setData({ ...currentData, config: newConfig });
        setRuminationState({ count: 0, isRuminationBlocked: false });
    };

    const completeTour = async (tourId: string) => {
        const currentData = vault.getData() || {} as VaultData;
        const tourConfig = currentData.config?.tourState || {};
        const newTourState = { ...tourConfig, [tourId]: { seen: true, completedAt: new Date().toISOString() }} as TourState;
        const newConfig = { ...currentData.config, tourState: newTourState };
        await vault.setData({ ...currentData, config: newConfig });
        setTourState(newTourState);
    };

    const setShowTours = async (show: boolean) => {
        const currentData = vault.getData() || {} as VaultData;
        const newConfig = { ...currentData.config, showTours: show };
        await vault.setData({ ...currentData, config: newConfig });
        setShowToursState(show);
    };

    const addNewEntry = async (entryData: ThoughtEntryData): Promise<AddEntryResult> => {
        setIsSaving(true);
        let detectedDistortions: CognitiveDistortion[] = [];

        try {
            if (ruminationState.isRuminationBlocked) {
                return { status: 'rumination_blocked' };
            }

            const sanitizedEntryData: ThoughtEntryData = { ...entryData, note: entryData.note.trim() };
            if (!sanitizedEntryData.note) {
                return { status: 'validation_error', message: t('reflection_label') };
            }

            let reclassifiedLevel: number | null = null;
            if (sanitizedEntryData.level === 3) {
                const isL2Complete = !!sanitizedEntryData.situation && !!sanitizedEntryData.automaticThought;
                const isL3Complete = isL2Complete && sanitizedEntryData.alternativeResponse && sanitizedEntryData.alternativeResponse.length >= MIN_L3_RESPONSE_LENGTH;

                if (!isL3Complete) {
                    reclassifiedLevel = isL2Complete ? 2 : 1;
                    sanitizedEntryData.level = reclassifiedLevel;
                    sanitizedEntryData.__draft = true;
                    const newCount = await incrementRuminationCount();
                    if (newCount >= RUMINATION_THRESHOLD) return { status: 'rumination_blocked' };
                } else {
                    await resetRumination();
                }
            }


            if (sanitizedEntryData.level === 3 && !sanitizedEntryData.__draft && sanitizedEntryData.automaticThought) {
                detectedDistortions = detectCognitiveDistortions(sanitizedEntryData.automaticThought, t, clinicalProfile);
            }
            
            const allEmotions = t('emotions');
            const negativeEmotionLabels = Array.isArray(allEmotions)
                ? allEmotions.filter((_, i) => [1, 3, 4, 6].includes(i)).map((emotion) => emotion.label)
                : [];
            const riskKeywords: string[] = t('risk_keywords') || [];
            const crisisRisk = detectCrisisRisk({
                note: sanitizedEntryData.note,
                automaticThought: sanitizedEntryData.automaticThought,
                situation: sanitizedEntryData.situation,
                emotion: sanitizedEntryData.emotion,
                intensity: sanitizedEntryData.intensity,
                riskKeywords,
                negativeEmotionLabels,
            });
            
            if(crisisRisk.risk) {
                setCrisisDetected(true);
                return { status: 'crisis_detected' };
            }

            const newEntry: ThoughtEntry = {
                ...sanitizedEntryData,
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                timestamp: Date.now(),
            };
            
            const currentData = vault.getData() || {} as VaultData;
            const newEntries = [newEntry, ...(currentData.cbtEntries || [])];
            const currentStats = calculateStats(newEntries, currentData.goals || [], t);
            const newAchievements: Achievement[] = [];
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
            const newConfig = { ...currentData.config, tourCompleted: true, [`lastPrompt_${locale}`]: sanitizedEntryData.promptUsed };

            await updateFullState({ ...currentData, cbtEntries: newEntries, achievements: finalAchievements, config: newConfig });
            
            return { status: 'saved', entryId: newEntry.id, isDraft: !!newEntry.__draft, newAchievements, distortions: detectedDistortions, reclassifiedLevel };
        } finally {
            setIsSaving(false);
        }
    };

    const updateCrisisConfig = async (newConfig: Partial<CrisisConfig>) => {
        const currentData = vault.getData() || {} as VaultData;
        const updatedConfig = { ...currentData.config, crisisConfig: { ...(currentData.config?.crisisConfig || {}), ...newConfig } };
        await updateFullState({ ...currentData, config: updatedConfig });
    };

    const removeEntry = async (id: string) => {
        const currentData = vault.getData() || {} as VaultData;
        const newEntries = (currentData.cbtEntries || []).filter((e: ThoughtEntry) => e.id !== id);
        await updateFullState({ ...currentData, cbtEntries: newEntries });
    };

    const clearJournal = async () => {
        await vault.wipe();
        await refreshJournal();
    };

    const importData = async (file: File): Promise<{success: boolean}> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const jsonText = e.target?.result as string;
                    if (!jsonText) throw new Error(t('error_invalid_import_file'));
                    
                    const importedData = JSON.parse(jsonText);

                    const currentData = vault.getData();
                    try {
                        if (isCognitBackupEnvelope(importedData)) {
                            const encryptedPayload = await readCognitBackupPayload(importedData);
                            await vault.importEncryptedPackage(encryptedPayload);
                        } else {
                            // Legacy plaintext exports are migrated and re-encrypted immediately.
                            if (!('cbtEntries' in importedData) && !('schemaVersion' in importedData)) {
                                throw new Error(t('error_invalid_import_file'));
                            }
                            await vault.replaceData(importedData);
                        }
                        await markBackupCreated();
                        refreshJournal();
                        resolve({ success: true });
                    } catch (_updateError) {
                        // Attempt to restore previous state if update fails
                        if (currentData) await vault.setData(currentData);
                        throw new Error(t('error_import_failed_restored'));
                    }

                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    };
    
    // --- Exposure State Management ---
    const saveExposureState = async (newState: ExposureState) => {
        const currentData = vault.getData() || {} as VaultData;
        await updateFullState({ ...currentData, exposureState: newState });
    }
    
    const addFearItem = (item: Omit<FearItem, 'id' | 'completed'>) => {
        const newItem: FearItem = { ...item, id: Date.now().toString(), completed: false };
        const newLadder = [...exposureState.fearLadder, newItem].sort((a,b) => a.rating - b.rating);
        saveExposureState({ ...exposureState, fearLadder: newLadder });
        toast({ title: t('erp_toast_item_added') });
    };

    const updateFearItem = (updatedItem: FearItem) => {
        const newLadder = exposureState.fearLadder.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.rating - b.rating);
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
        const reduction = log.initialAnxiety - log.finalAnxiety;
        toast({
            title: t('erp_toast_log_saved'),
            description: t('erp_toast_log_desc', { reduction: reduction }),
        })
    };

    // --- Activation State Management ---
    const saveActivationState = async (newState: ActivationState) => {
        const currentData = vault.getData() || {} as VaultData;
        await updateFullState({ ...currentData, activationState: newState });
    };

    const addActivationValue = (value: Omit<ActivationValue, 'id'>) => {
        const newValue: ActivationValue = { ...value, id: Date.now().toString() };
        const newValues = [...activationState.values, newValue];
        saveActivationState({ ...activationState, values: newValues });
    };

    const updateActivationValue = (updatedValue: ActivationValue) => {
        const newValues = activationState.values.map(v => v.id === updatedValue.id ? updatedValue : v);
        saveActivationState({ ...activationState, values: newValues });
    };

    const deleteActivationValue = (id: string) => {
        const newValues = activationState.values.filter(v => v.id !== id);
        // Also delete associated activities
        const newActivities = activationState.activities.filter(a => a.valueId !== id);
        saveActivationState({ values: newValues, activities: newActivities });
    };

    const addActivationActivity = (activity: Omit<ActivationActivity, 'id'>) => {
        const newActivity: ActivationActivity = { ...activity, id: Date.now().toString(), subtasks: [] };
        const newActivities = [...activationState.activities, newActivity];
        saveActivationState({ ...activationState, activities: newActivities });
    };

    const updateActivationActivity = (updatedActivity: ActivationActivity) => {
        const newActivities = activationState.activities.map(a => a.id === updatedActivity.id ? updatedActivity : a);
        saveActivationState({ ...activationState, activities: newActivities });
    };

    const deleteActivationActivity = (id: string) => {
        const newActivities = activationState.activities.filter(a => a.id !== id);
        saveActivationState({ ...activationState, activities: newActivities });
    };

    const addSubtask = (activityId: string, subtaskName: string) => {
        const newSubtask: Subtask = { id: Date.now().toString(), name: subtaskName, completed: false };
        const newActivities = activationState.activities.map(a => {
            if (a.id === activityId) {
                return { ...a, subtasks: [...(a.subtasks || []), newSubtask] };
            }
            return a;
        });
        saveActivationState({ ...activationState, activities: newActivities });
    };

    const toggleSubtask = (activityId: string, subtaskId: string) => {
        const newActivities = activationState.activities.map(a => {
            if (a.id === activityId) {
                const newSubtasks = (a.subtasks || []).map(st => {
                    if (st.id === subtaskId) {
                        const isCompleting = !st.completed;
                        return { 
                            ...st, 
                            completed: isCompleting,
                            completedAt: isCompleting ? todayISO() : undefined
                        };
                    }
                    return st;
                });
                return { ...a, subtasks: newSubtasks };
            }
            return a;
        });
        saveActivationState({ ...activationState, activities: newActivities });
    };

    // --- Goals State Management ---
    const saveGoals = async (newGoals: Goal[]) => {
        await updateFullState({ goals: newGoals });
    };

    const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'status' | 'progress' | 'cbtEntryId' >) => {
        const newGoal: Goal = {
            ...goal,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: "in-progress",
            progress: 0,
            priority: goal.priority || 'medium'
        };
        await saveGoals([...goals, newGoal]);
        toast({ title: t('goals.toast_created') });
    };

    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        let wasCompleted = false;
        const newGoals = goals.map((goal) => {
            if (goal.id === id) {
                const updatedGoal = { ...goal, ...updates };
                const newStatus = getGoalStatus(updatedGoal);
                if(newStatus === 'completed' && goal.status !== 'completed') {
                    wasCompleted = true;
                }
                return { ...updatedGoal, status: newStatus };
            }
            return goal;
        });
        await saveGoals(newGoals);
        
        if (!wasCompleted) { // Avoid double toast
            toast({ title: t('goals.toast_updated') });
        }
    };
    
    const deleteGoal = async (id: string) => {
        await saveGoals(goals.filter((goal) => goal.id !== id));
        toast({ title: t('goals.toast_deleted'), variant: 'destructive' });
    };

    const completeGoal = async (id: string) => {
        await updateGoal(id, { progress: 100 });
        toast({ title: t('goals.toast_completed') });
        
        const currentData = vault.getData() || {} as VaultData;
        const currentAchievements = currentData.achievements || [];
        const goalAchievement: Achievement = {
            id: `goal-completed-${id}`,
            name: "Goal Achieved!",
            emoji: "🎯",
            unlockedAt: new Date().toISOString()
        };
        if (!currentAchievements.some(ach => ach.id === goalAchievement.id)) {
            const finalAchievements = [...currentAchievements, goalAchievement];
            await updateFullState({ ...currentData, achievements: finalAchievements });
        }
    };
    

    const linkGoalToCbtEntry = async (goalId: string, entryId: string) => {
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
            await updateGoal(goalId, { cbtEntryId: entryId });
            
            const newEntries = allEntries.map(entry => 
                entry.id === entryId ? { ...entry, linkedGoalId: goalId } : entry
            );
            
            const currentData = vault.getData() || {} as VaultData;
            await updateFullState({ ...currentData, cbtEntries: newEntries });
            toast({ title: t('goals.toast_linked') });
        }
    };

    // --- Wellness State Management ---
    const addGratitudeEntry = async (items: string[]) => {
        const newEntry: GratitudeEntry = {
            id: Date.now().toString(),
            date: todayISO(),
            items,
        };
        const currentData = vault.getData() || {} as VaultData;
        const newGratitudeEntries = [newEntry, ...(currentData.gratitudeEntries || [])];
        await updateFullState({ ...currentData, gratitudeEntries: newGratitudeEntries });
        toast({ title: t('wellness_gratitude_saved_toast') });
    };

    const addMeditationEntry = async (type: 'breathing' | 'body_scan', durationMinutes: number) => {
        const note = t('meditation_journal_note', { type: t(`meditation_type_${type}`), duration: durationMinutes });
        await addNewEntry({
            date: todayISO(),
            level: 1,
            emotion: t('meditation_journal_emotion'),
            intensity: 2, // Low intensity, calm
            note: note,
            tags: ['mindfulness', 'meditación', type],
            isMeditation: true,
            promptUsed: 'Guided Meditation',
            situation: '',
            automaticThought: '',
            alternativeResponse: '',
        });
    };

    // --- Sleep State Management ---
    const addSleepEntry = async (entry: Omit<SleepEntry, 'id' | 'sleepEfficiency' | 'crossesMidnight' | 'timeInBedMin' | 'timeAsleepMin' | 'createdAt' | 'updatedAt'>) => {
        
        const timeToMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        const bedTimeMins = timeToMinutes(entry.bedTime);
        const wakeTimeMins = timeToMinutes(entry.wakeTime);
        
        const crossesMidnight = wakeTimeMins < bedTimeMins;
        
        const timeInBedMin = crossesMidnight 
            ? (24 * 60 - bedTimeMins) + wakeTimeMins 
            : wakeTimeMins - bedTimeMins;
        
        if (timeInBedMin < 30) {
            toast({ title: t('error_title'), description: t('sleep.validation.anomalous_values'), variant: 'destructive'});
            return;
        }

        const timeAsleepMin = timeInBedMin - (entry.latencyMin + entry.awakeMinutes);

        if (timeAsleepMin < 0) {
            toast({ title: t('error_title'), description: t('sleep.validation.anomalous_values'), variant: 'destructive'});
            return;
        }

        const sleepEfficiencyPct = timeInBedMin > 0 ? (timeAsleepMin / timeInBedMin) * 100 : 0;
        
        const newEntry: SleepEntry = {
            ...entry,
            id: crypto.randomUUID(),
            crossesMidnight,
            timeInBedMin,
            timeAsleepMin,
            sleepEfficiencyPct: parseFloat(sleepEfficiencyPct.toFixed(1)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const currentData = vault.getData() || {} as VaultData;
        const newSleepEntries = [newEntry, ...(currentData.sleepEntries || [])];
        await updateFullState({ ...currentData, sleepEntries: newSleepEntries });
        toast({ title: t('sleep.toast.saved.title'), description: t('sleep.toast.saved.desc', { value: (newEntry.sleepEfficiencyPct ?? 0).toFixed(0) }) });
    };

    const setClinicalProfile = async (profile: ClinicalProfile) => {
        const currentData = vault.getData() || {} as VaultData;
        const config = currentData.config || {};
        await updateFullState({ ...currentData, config: { ...config, clinicalProfile: profile }});
        setClinicalProfileState(profile);
    };
    
    return {
        cbtEntries: allEntries,
        entries: allEntries,
        stats,
        achievements,
        isLoading: isLoading || vault.locked,
        isSaving,
        dbStatus: 'ok' as const, // Simplified, vault handles its own state
        analysis,
        crisisConfig,
        crisisDetected,
        showBackupReminder,
        setCrisisDetected,
        setShowBackupReminder,
        drafts,
        saveThoughtFormDraft,
        clearThoughtFormDraft,
        saveGratitudeDraft,
        clearGratitudeDraft,
        exportEncryptedBackup,
        markBackupCreated,
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
        activationState,
        addActivationValue,
        updateActivationValue,
        deleteActivationValue,
        addActivationActivity,
        updateActivationActivity,
        deleteActivationActivity,
        addSubtask,
        toggleSubtask,
        goals,
        addGoal,
        updateGoal,
        completeGoal,
        deleteGoal,
        ruminationState,
        resetRumination,
        tourState,
        showTours,
        setShowTours,
        completeTour,
        clinicalProfile,
        setClinicalProfile,

        linkGoalToCbtEntry,
        gratitudeEntries,
        addGratitudeEntry,
        addMeditationEntry,
        sleepEntries,
        addSleepEntry,
        t,
    };
};

type JournalContextValue = ReturnType<typeof useCbtJournalState>;

const JournalContext = createContext<JournalContextValue | undefined>(undefined);

export const JournalProvider = ({ children }: { children: React.ReactNode }) => {
    const value = useCbtJournalState();
    return React.createElement(JournalContext.Provider, { value }, children);
};

export const useJournal = () => {
    const context = useContext(JournalContext);
    if (!context) {
        throw new Error('useJournal must be used within JournalProvider');
    }
    return context;
};

export const useCbtJournal = useJournal;
