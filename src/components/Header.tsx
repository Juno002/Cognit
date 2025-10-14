
"use client";

import React, { useState } from 'react';
import { BrainCircuit, Sun, Moon, HelpCircle, Download, Upload, Trash2, Settings, FileText, FileJson, FileSpreadsheet, Zap, CheckCircle, AlertCircle, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import HelpModal from './modals/HelpModal';
import SettingsModal from './modals/SettingsModal';
import type { CrisisConfig } from '@/hooks/use-cbt-journal';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface HeaderProps {
    dbStatus: 'ok' | 'error' | 'loading';
    isSaving: boolean;
    onReset: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExportJson: () => void;
    onExportCsv: () => void;
    onExportReport: () => void;
    onExportL3Report: () => void;
    onAutoZip: () => void;
    onExportFhir: () => void;
    isZipping: boolean;
    crisisConfig: CrisisConfig;
    updateCrisisConfig: (config: Partial<CrisisConfig>) => void;
    lastPrompt: string;
}

const Header: React.FC<HeaderProps> = ({ dbStatus, isSaving, onReset, onImport, onExportJson, onExportCsv, onExportReport, onExportL3Report, onAutoZip, onExportFhir, isZipping, crisisConfig, updateCrisisConfig, lastPrompt }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  React.useEffect(() => setIsMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const importInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-auto min-h-16 flex-col items-center justify-between gap-2 py-2 md:flex-row md:h-16">
        <div className="flex items-center gap-3">
           <div className={cn("relative h-8 w-8", isSaving && "animate-pulse")}>
            <BrainCircuit className={cn("h-8 w-8 text-primary transition-all", isSaving && "scale-110")}/>
             {isSaving && <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              Cognit λ
            </h1>
            <p className="text-xs text-muted-foreground">{t('header_tagline')}</p>
          </div>
          {dbStatus === 'ok' && (
            <Badge variant="outline" className="hidden md:flex items-center gap-1 border-green-500/50 text-green-600">
                <CheckCircle className="h-3 w-3" /> {t('header_db_ready')}
            </Badge>
          )}
          {dbStatus === 'error' && (
            <Badge variant="destructive" className="hidden md:flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {t('header_db_error')}
            </Badge>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-1 md:w-auto md:flex-nowrap md:gap-2">
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="sm" aria-label={t('header_help_aria')} className="h-8 px-2 sm:h-9 sm:px-3">
                        <HelpCircle className="h-5 w-5 md:mr-1"/>
                        <span className="hidden md:inline">{t('header_help')}</span>
                    </Button>
                </DialogTrigger>
                <HelpModal />
            </Dialog>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="sm" aria-label={t('header_settings_aria')} className="h-8 px-2 sm:h-9 sm:px-3">
                        <Settings className="h-5 w-5 md:mr-1"/>
                        <span className="hidden md:inline">{t('header_settings')}</span>
                    </Button>
                </DialogTrigger>
                <SettingsModal 
                    crisisConfig={crisisConfig}
                    updateCrisisConfig={updateCrisisConfig}
                    lastPrompt={lastPrompt}
                />
            </Dialog>
            
            <Button variant="outline" size="sm" onClick={onExportL3Report} className="h-8 px-2 sm:h-9 sm:px-3">
                <span className="mr-1">✨</span> L3
            </Button>
            
            <Button variant="secondary" size="sm" onClick={onAutoZip} disabled={isZipping} className="h-8 px-2 sm:h-9 sm:px-3">
                <Zap className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{isZipping ? t('header_zipping') : t('header_autozip')}</span>
            </Button>

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
                        <Download className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">{t('header_export')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>{t('header_export_data')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onExportReport}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{t('header_export_report')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportJson}>
                        <FileJson className="mr-2 h-4 w-4" />
                        <span>{t('header_export_json')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportCsv}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        <span>{t('header_export_csv')}</span>
                    </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={onExportFhir}>
                        <HeartPulse className="mr-2 h-4 w-4" />
                        <span>{t('header_export_fhir')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()} className="h-8 px-2 sm:h-9 sm:px-3">
                <Upload className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('header_import')}</span>
            </Button>
            <input
                type="file"
                ref={importInputRef}
                className="hidden"
                accept=".json"
                onChange={onImport}
            />

            {isMounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('header_toggle_theme_aria')} className="h-8 w-8 sm:h-9 sm:w-9">
                {theme === 'dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
                <span className="sr-only">{t('header_toggle_theme_aria')}</span>
              </Button>
            )}
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9" aria-label={t('header_reset_aria')}>
                        <Trash2 className="h-5 w-5"/>
                        <span className="sr-only">{t('header_reset')}</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('reset_dialog_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('reset_dialog_desc')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onReset} className="bg-destructive hover:bg-destructive/90">
                        {t('reset_dialog_confirm')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </header>
  );
};

export default Header;
