"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface BreathingGuideProps {
  onStop: () => void;
}

const BreathingGuide: React.FC<BreathingGuideProps> = ({ onStop }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(t('breathing_inhale'));
  const [animationClass, setAnimationClass] = useState('animate-in');

  useEffect(() => {
    const cycle = [
      { name: t('breathing_inhale'), duration: 4000, className: 'animate-in' },
      { name: t('breathing_hold'), duration: 7000, className: 'animate-hold' },
      { name: t('breathing_exhale'), duration: 8000, className: 'animate-out' },
    ];
    let currentIndex = 0;
    
    const runCycle = () => {
      const currentPhase = cycle[currentIndex];
      setPhase(currentPhase.name);
      setAnimationClass(currentPhase.className);
      
      currentIndex = (currentIndex + 1) % cycle.length;
      
      const timeoutId = setTimeout(runCycle, currentPhase.duration);
      return () => clearTimeout(timeoutId);
    };

    const clearCycle = runCycle();

    return clearCycle;
  }, [t]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-4">
            <h3 className="text-xl font-semibold text-foreground">{t('breathing_title')}</h3>
            <p className="text-muted-foreground mb-4">{t('breathing_desc')}</p>
            <div className={cn("breathing-circle my-6", animationClass)}></div>
            <p className="text-lg font-bold mt-4 min-h-[28px] text-warning">{phase}</p>
            <Button onClick={onStop} variant="destructive" className="mt-6">🛑 {t('stop_exercise_button')}</Button>
        </div>
    );
};

export default BreathingGuide;
