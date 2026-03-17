
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

interface BackupReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackup: () => void;
}

const BackupReminderModal: React.FC<BackupReminderModalProps> = ({ isOpen, onClose, onBackup }) => {
    const { t } = useTranslation();
    const handleBackupNow = () => {
        onBackup();
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-warning text-2xl">{t('backup_reminder_title')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-base" dangerouslySetInnerHTML={{ __html: t('backup_reminder_desc') }} />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="ghost" onClick={onClose}>{t('backup_reminder_ignore')}</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                         <Button onClick={handleBackupNow} className="bg-warning hover:bg-warning/90">{t('backup_reminder_action')}</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default BackupReminderModal;
