
"use client";

import React, { useState } from 'react';
import { Sun, Moon, HelpCircle, Download, Upload, Trash2, Settings, FileText, FileJson, FileSpreadsheet, Zap, CheckCircle, AlertCircle, HeartPulse, Printer, MoreVertical, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
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
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import HelpModal from '@/components/modals/HelpModal';
import SettingsModal from '@/components/modals/SettingsModal';
import type { CrisisConfig } from '@/hooks/use-cbt-journal';
import { Badge } from '@/components/ui/badge';
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
    onPrintReport: () => void;
    isZipping: boolean;
    crisisConfig: CrisisConfig;
    updateCrisisConfig: (config: Partial<CrisisConfig>) => void;
    lastPrompt: string;
    onNavigate: (tab: 'analysis') => void;
}

const Header: React.FC<HeaderProps> = ({ dbStatus, isSaving, onReset, onImport, onExportJson, onExportCsv, onExportReport, onExportL3Report, onAutoZip, onExportFhir, onPrintReport, isZipping, crisisConfig, updateCrisisConfig, lastPrompt, onNavigate }) => {
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
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-2 md:px-4">
        <div className="flex items-center gap-2">
          <span className={cn("text-3xl text-primary transition-all duration-200 hover:scale-110", isSaving && "scale-110 animate-pulse")} role="img" aria-label="Lambda">λ</span>
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              Cognit
            </h1>
            <p className="text-xs text-muted-foreground">{t('header_tagline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" aria-label={t('tab_analysis')} className="h-9 px-2" onClick={() => onNavigate('analysis')} data-tour="analysis-tab-button">
                <BarChart2 className="h-5 w-5"/>
            </Button>
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="sm" aria-label={t('header_help_aria')} className="h-9 px-2">
                        <HelpCircle className="h-5 w-5"/>
                    </Button>
                </DialogTrigger>
                <HelpModal />
            </Dialog>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="sm" aria-label={t('header_settings_aria')} className="h-9 px-2">
                        <Settings className="h-5 w-5"/>
                    </Button>
                </DialogTrigger>
                <SettingsModal 
                    crisisConfig={crisisConfig}
                    updateCrisisConfig={updateCrisisConfig}
                    lastPrompt={lastPrompt}
                />
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-2">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>{t('header_export_data')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onAutoZip} disabled={isZipping} data-tour="autozip-button">
                            <Zap className="mr-2 h-4 w-4" />
                            <span>{isZipping ? t('header_zipping') : t('header_autozip')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExportL3Report}>
                            <span className="mr-2 h-4 w-4">✨</span>
                            <span>{t('l3_report_title')}</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={onPrintReport}>
                            <Printer className="mr-2 h-4 w-4" />
                            <span>{t('header_export_pdf')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExportReport}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{t('header_export_report')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                     <DropdownMenuGroup>
                        <DropdownMenuLabel>Gestión de Datos</DropdownMenuLabel>
                         <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            <span>{t('header_import')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExportJson}>
                            <FileJson className="mr-2 h-4 w-4" />
                            <span>{t('header_export_json')}</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={onExportCsv}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            <span>{t('header_export_csv')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExportFhir}>
                            <HeartPulse className="mr-2 h-4 w-4" />
                            <span>{t('header_export_fhir')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                     <DropdownMenuGroup>
                        <DropdownMenuItem onClick={toggleTheme}>
                             {theme === 'dark' ? <Sun className="mr-2 h-4 w-4"/> : <Moon className="mr-2 h-4 w-4"/>}
                             <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>{t('header_reset')}...</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>{t('reset_dialog_title')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('reset_dialog_desc')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={onReset} className="bg-destructive hover:bg-destructive/90">
                                    {t('reset_dialog_confirm')}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                type="file"
                ref={importInputRef}
                className="hidden"
                accept=".json"
                onChange={onImport}
            />
        </div>
      </div>
    </header>
  );
};

export default Header;
