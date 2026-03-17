
"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { CrisisConfig } from '@/types';
import { escapeHtml } from '@/lib/utils';
import { Button } from '../ui/button';
import BreathingGuide from '../BreathingGuide';
import { useTranslation } from '@/hooks/use-translation';

const CrisisModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    crisisConfig: CrisisConfig;
}> = ({ isOpen, onClose, crisisConfig }) => {
    const { t } = useTranslation();
    const { copingPhrase, contacts } = crisisConfig;
    const [showBreathing, setShowBreathing] = useState(false);

    const defaultCrisisLine = t('default_crisis_line');
    const localLines = [
        defaultCrisisLine,
        ...(t('extra_crisis_lines') || []),
    ];
    
    const handleClose = () => {
        setShowBreathing(false);
        onClose();
    }

    // Reset breathing guide view when modal is closed externally
    useEffect(() => {
        if (!isOpen) {
            setShowBreathing(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive text-2xl">🚨 {t('crisis_modal_title')}</AlertDialogTitle>
                     <AlertDialogDescription className="text-base pt-2">
                       {showBreathing 
                         ? t('crisis_modal_breathing_desc')
                         : t('crisis_modal_desc')
                       }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                {showBreathing ? (
                    <BreathingGuide onStop={() => setShowBreathing(false)} />
                ) : (
                    <div className="my-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        <div>
                            <h3 className="font-semibold text-primary mb-2">{t('coping_phrase_title')}:</h3>
                            <div className="border-l-4 border-primary bg-primary/10 p-3 rounded-r-md">
                                <p className="font-medium italic">{escapeHtml(copingPhrase)}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-destructive mb-2">{t('emergency_contacts_title')}:</h3>
                            <div className="space-y-2">
                                {contacts && contacts.length > 0 ? contacts.map(contact => (
                                    <div key={contact.id} className="border-l-4 border-destructive bg-destructive/10 p-3 rounded-r-md">
                                        <p><strong>{escapeHtml(contact.name)}:</strong> <a href={`tel:${contact.phone}`} className="font-bold underline hover:text-destructive/80">{escapeHtml(contact.phone)}</a></p>
                                    </div>
                                )) : (
                                    <div className="border-l-4 border-warning bg-warning/10 p-3 rounded-r-md">
                                        <p>{t('no_contacts_configured')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-destructive mb-2">{t('help_lines_title')}:</h3>
                            <div className="space-y-2">
                                {localLines.map(line => (
                                    <div key={line.code} className="border-l-4 border-destructive bg-destructive/10 p-3 rounded-r-md">
                                        <p><strong>{line.name} ({line.code}):</strong> <a href={`tel:${line.number}`} className="font-bold underline hover:text-destructive/80">{line.number}</a></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                <AlertDialogFooter className="pt-4 flex-col sm:flex-row sm:justify-between sm:w-full">
                     {!showBreathing && (
                        <Button variant="outline" size="lg" onClick={() => setShowBreathing(true)}>
                            🌬️ {t('breathing_guide_button')}
                        </Button>
                    )}
                    <AlertDialogAction onClick={handleClose} className="w-full sm:w-auto mt-2 sm:mt-0">
                        ✅ {t('understood_button')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default CrisisModal;
