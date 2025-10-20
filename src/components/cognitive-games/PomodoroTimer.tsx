
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Clock, Play, Pause, RefreshCw } from 'lucide-react';

const PomodoroTimer: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds > 0) {
                    setSeconds(seconds - 1);
                } else {
                    if (minutes > 0) {
                        setMinutes(minutes - 1);
                        setSeconds(59);
                    } else {
                        setIsActive(false);
                        toast({
                            title: t('pomodoro_session_complete_title'),
                            description: t('pomodoro_session_complete_desc'),
                        });
                        // Play a notification sound
                        new Audio('/notification.mp3').play().catch(e => console.log("Failed to play sound", e));
                    }
                }
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, seconds, minutes, t, toast]);

    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        setMinutes(25);
        setSeconds(0);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="text-destructive" />
                    {t('pomodoro_title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <div className="text-6xl font-bold my-4">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={toggle} variant={isActive ? 'destructive' : 'default'}>
                        {isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {isActive ? t('pomodoro_stop_button') : t('pomodoro_start_button')}
                    </Button>
                    <Button onClick={reset} variant="secondary">
                        <RefreshCw className="mr-2"/>
                        {t('pomodoro_reset_button')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default PomodoroTimer;
