
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldAlert, CloudRain, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClinicalProfile } from '@/types';

interface ClinicalOnboardingProps {
    onComplete: (profile: ClinicalProfile) => Promise<void>;
}

export const ClinicalOnboarding: React.FC<ClinicalOnboardingProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<ClinicalProfile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(true);

    const options = [
        {
            id: 'anxiety' as ClinicalProfile,
            title: t('onboarding_quiz.option_anxiety'),
            desc: t('onboarding_quiz.option_anxiety_desc'),
            icon: ShieldAlert,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            id: 'depression' as ClinicalProfile,
            title: t('onboarding_quiz.option_depression'),
            desc: t('onboarding_quiz.option_depression_desc'),
            icon: CloudRain,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20'
        },
        {
            id: 'anger' as ClinicalProfile,
            title: t('onboarding_quiz.option_anger'),
            desc: t('onboarding_quiz.option_anger_desc'),
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        }
    ];

    const handleFinish = async () => {
        if (!selected) return;
        setIsSubmitting(true);
        try {
            await onComplete(selected);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="w-full max-w-2xl"
            >
                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                    
                    <CardHeader className="text-center pt-10 pb-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                {showDisclaimer ? t('clinical_disclaimer_title') : t('onboarding_quiz.title')}
                            </CardTitle>
                            <CardDescription className="text-lg mt-3 max-w-md mx-auto">
                                {!showDisclaimer && t('onboarding_quiz.subtitle')}
                            </CardDescription>
                        </motion.div>
                    </CardHeader>

                    <CardContent className="px-6 pb-10 relative z-10">
                        {showDisclaimer ? (
                            <div className="flex flex-col items-center py-8">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/20 mb-8 max-w-md text-center"
                                >
                                    <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                                        {t('clinical_disclaimer_body')}
                                    </p>
                                </motion.div>
                                <Button 
                                    size="lg"
                                    className="h-12 px-8 text-lg font-semibold rounded-xl"
                                    onClick={() => setShowDisclaimer(false)}
                                >
                                    {t('clinical_disclaimer_button_onboarding')}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {options.map((opt, idx) => {
                                const Icon = opt.icon;
                                const isSelected = selected === opt.id;
                                
                                return (
                                    <motion.button
                                        key={opt.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + (idx * 0.1) }}
                                        onClick={() => setSelected(opt.id)}
                                        className={cn(
                                            "relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-300 group",
                                            isSelected 
                                                ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20 scale-[1.02]" 
                                                : "border-border bg-card/20 hover:border-primary/40 hover:bg-primary/5 shadow-sm"
                                        )}
                                    >
                                        <div className={cn("p-4 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110", opt.bg, opt.color)}>
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{opt.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {opt.desc}
                                        </p>
                                        
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1"
                                                >
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                );
                            })}
                        </div>

                                <div className="flex flex-col items-center gap-4">
                                    <motion.div
                                        animate={selected ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                        className="w-full max-w-xs"
                                    >
                                        <Button 
                                            className="w-full h-12 text-lg font-semibold rounded-xl group overflow-hidden" 
                                            disabled={!selected || isSubmitting}
                                            onClick={handleFinish}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {t('onboarding_quiz.button_finish')}
                                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                            <motion.div 
                                                className="absolute inset-0 bg-primary/20"
                                                initial={{ x: '-100%' }}
                                                whileHover={{ x: '100%' }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </Button>
                                    </motion.div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => onComplete('unspecified')}
                                        disabled={isSubmitting}
                                    >
                                        {t('onboarding_quiz.option_skip')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>

                    {/* Decorative lines */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </Card>
            </motion.div>
        </div>
    );
};
