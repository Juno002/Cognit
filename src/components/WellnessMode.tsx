
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { Sparkles, History, Send } from 'lucide-react';
import DefusionGame from './cognitive-games/DefusionGame';
import GuidedMeditation from './cognitive-games/GuidedMeditation';
import type { GratitudeEntry, SleepEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import SleepDiary from './SleepDiary';

interface WellnessModeProps {
    gratitudeEntries: GratitudeEntry[];
    onAddGratitude: (items: string[]) => void;
    onAddMeditation: (type: 'breathing' | 'body_scan', duration: number) => void;
    onOpenJournal: (open: boolean) => void;
    sleepEntries: SleepEntry[];
    onAddSleepEntry: (data: Omit<SleepEntry, 'id' | 'sleepEfficiencyPct' | 'crossesMidnight' | 'timeInBedMin' | 'timeAsleepMin' | 'createdAt' | 'updatedAt' | 'linkedJournalEntryId'>) => void;
}

const GratitudeJournal: React.FC<{ onAddGratitude: (items: string[]) => void; isSaving: boolean; }> = ({ onAddGratitude, isSaving }) => {
    const { t } = useTranslation();
    const STORAGE_KEY = 'wellness_gratitude_draft';
    const [items, setItems] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return ['', '', ''];
                }
            }
        }
        return ['', '', ''];
    });

    React.useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);
    
    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        const gratitudeItems = items.filter(item => item.trim() !== '');
        if (gratitudeItems.length === 0) return;
        onAddGratitude(gratitudeItems);
        setItems(['', '', '']); // Reset form
        localStorage.removeItem(STORAGE_KEY);
    };
    
    const canSubmit = useMemo(() => items.some(item => item.trim() !== ''), [items]);

    return (
        <Card className="flex flex-col" data-tour="gratitude-journal-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-yellow-500" />
                    {t('wellness_gratitude_title')}
                </CardTitle>
                <CardDescription>{t('wellness_gratitude_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <p className="font-semibold text-muted-foreground">{t('wellness_gratitude_prompt')}</p>
                {items.map((item, index) => (
                    <Input
                        key={index}
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        placeholder={t(`wellness_gratitude_item_placeholder_${index + 1}`)}
                    />
                ))}
                <Button onClick={handleSave} className="w-full" disabled={!canSubmit || isSaving}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSaving ? t('saving_button') : t('wellness_save_gratitude_button')}
                </Button>
            </CardContent>
        </Card>
    );
};

const GratitudeHistory: React.FC<{ entries: GratitudeEntry[]; t: (key: string) => string; }> = ({ entries, t }) => {
    const sortedEntries = useMemo(() => entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [entries]);
    
    if (entries.length === 0) {
        return null;
    }

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="text-primary"/>
                    {t('wellness_gratitude_history_title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <div className="space-y-4 pr-4">
                        {sortedEntries.map(entry => (
                            <div key={entry.id} className="border-b pb-2">
                                <p className="font-bold text-sm text-primary">{formatDate(entry.date, t('locale'))}</p>
                                <ul className="list-disc list-inside text-muted-foreground text-sm mt-1">
                                    {entry.items.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

const WellnessMode: React.FC<WellnessModeProps> = ({ gratitudeEntries, onAddGratitude, onAddMeditation, onOpenJournal, sleepEntries, onAddSleepEntry }) => {
    const { t } = useTranslation();
    const [isSavingGratitude, setIsSavingGratitude] = useState(false);
    
    const handleAddGratitude = async (items: string[]) => {
        setIsSavingGratitude(true);
        await onAddGratitude(items);
        setIsSavingGratitude(false);
    }

    return (
        <div className="mt-6 space-y-6">
            <div data-tour="sleep-diary-card">
                <SleepDiary entries={sleepEntries} onAddEntry={onAddSleepEntry} />
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <GratitudeJournal onAddGratitude={handleAddGratitude} isSaving={isSavingGratitude} />
                <DefusionGame onOpenJournal={() => onOpenJournal(true)} />
                <GuidedMeditation />
                <GratitudeHistory entries={gratitudeEntries} t={t} />
            </div>
        </div>
    );
};

export default WellnessMode;
