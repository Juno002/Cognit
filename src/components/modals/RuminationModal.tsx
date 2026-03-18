
"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import ReflejoAvatar from '@/components/ReflejoAvatar';

interface RuminationModalProps {
    isOpen: boolean;
    onClose: (skipped: boolean) => void;
}

const RuminationModal: React.FC<RuminationModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(60);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCountdown(60);
            setCanSkip(false);
            return;
        };

        const skipTimer = setTimeout(() => setCanSkip(true), 30000);
        
        if (countdown <= 0) {
            return;
        }

        const countdownTimer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => {
            clearInterval(countdownTimer);
            clearTimeout(skipTimer);
        };

    }, [isOpen, countdown]);


    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="flex flex-col items-center">
                    <ReflejoAvatar mode="anchor" size={80} className="mb-4" />
                    <AlertDialogTitle className="text-lambda-anchor text-2xl text-center">{t('rumination_modal_title')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-center space-y-2">
                        <p className="font-bold italic text-lambda-anchor">"{t('lambda_anchor_rumination')}"</p>
                        <p>{t('rumination_modal_desc1')}</p>
                        <p>{t('rumination_modal_desc2')}</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="flex items-center justify-center text-6xl font-bold text-lambda-anchor my-6">
                    {countdown > 0 ? countdown : t('rumination_modal_end')}
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row">
                    <Button variant="ghost" onClick={() => onClose(true)} disabled={!canSkip}>
                        {canSkip ? t('rumination_modal_skip') : t('rumination_modal_wait_to_skip', { count: countdown - 30 })}
                    </Button>
                    <Button onClick={() => onClose(false)} disabled={countdown > 0}>
                        ✅ {t('rumination_modal_done')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default RuminationModal;
