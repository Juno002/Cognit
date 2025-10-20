
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Wind, Play, Pause, RefreshCw } from 'lucide-react';
import { useCbtJournal } from '@/hooks/use-cbt-journal';

type MeditationType = 'breathing' | 'body_scan';

const GuidedMeditation: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { addMeditationEntry } = useCbtJournal();
    const [durationMinutes, setDurationMinutes] = useState(5);
    const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [meditationType, setMeditationType] = useState<MeditationType>('breathing');

    const handleSessionComplete = useCallback(async () => {
        setIsActive(false);
        await addMeditationEntry(meditationType, durationMinutes);
        toast({
            title: t('meditation_session_complete_title'),
            description: t('meditation_session_complete_desc', { duration: durationMinutes }),
        });
        // Play notification sound
        new Audio('/notification.mp3').play().catch(e => console.log("Failed to play sound", e));
    }, [addMeditationEntry, meditationType, durationMinutes, t, toast]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(prev => prev - 1);
            }, 1000);
        } else if (isActive && secondsLeft === 0) {
            handleSessionComplete();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsLeft, handleSessionComplete]);

    const toggle = () => setIsActive(!isActive);

    const reset = useCallback(() => {
        setIsActive(false);
        setSecondsLeft(durationMinutes * 60);
    }, [durationMinutes]);

    const handleDurationChange = (value: string) => {
        const newDuration = parseInt(value, 10);
        setDurationMinutes(newDuration);
        if (!isActive) {
            setSecondsLeft(newDuration * 60);
        }
    };
    
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wind className="text-primary" />
                    {t('meditation_title')}
                </CardTitle>
                <CardDescription>{t('meditation_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                 <div className="grid grid-cols-2 gap-4">
                     <Select value={meditationType} onValueChange={(v) => setMeditationType(v as MeditationType)} disabled={isActive}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('meditation_select_type_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="breathing">{t('meditation_type_breathing')}</SelectItem>
                            <SelectItem value="body_scan">{t('meditation_type_body_scan')}</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={String(durationMinutes)} onValueChange={handleDurationChange} disabled={isActive}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('meditation_select_duration_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">{t('meditation_duration_1_min')}</SelectItem>
                            <SelectItem value="5">{t('meditation_duration_5_min')}</SelectItem>
                            <SelectItem value="10">{t('meditation_duration_10_min')}</SelectItem>
                            <SelectItem value="15">{t('meditation_duration_15_min')}</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                
                <div className="text-6xl font-bold my-4 tabular-nums text-foreground">
                    {formatTime(secondsLeft)}
                </div>

                <div className="text-muted-foreground text-sm min-h-[40px]">
                    <p>{t(`meditation_instruction_${meditationType}`)}</p>
                </div>

                <div className="flex justify-center gap-4">
                    <Button onClick={toggle} size="lg" className={isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary'}>
                        {isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {t(isActive ? 'meditation_pause_button' : 'meditation_start_button')}
                    </Button>
                    <Button onClick={reset} variant="secondary" size="lg">
                        <RefreshCw className="mr-2"/>
                        {t('meditation_reset_button')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default GuidedMeditation;
