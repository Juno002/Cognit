
"use client";

import React, { useState } from 'react';
import { HelpCircle, Settings, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import HelpModal from '@/components/modals/HelpModal';
import SettingsModal from '@/components/modals/SettingsModal';
import type { CrisisConfig } from '@/types';
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
    onNavigate: (tab: 'analysis') => void;
}

const Header: React.FC<HeaderProps> = ({ dbStatus: _dbStatus, isSaving, onReset, onImport, onExportJson, onExportCsv, onExportReport, onExportL3Report, onAutoZip, onExportFhir, onPrintReport, isZipping, crisisConfig, updateCrisisConfig, onNavigate }) => {
  const { t } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
                    onImport={onImport}
                    onExportJson={onExportJson}
                    onExportCsv={onExportCsv}
                    onExportReport={onExportReport}
                    onExportL3Report={onExportL3Report}
                    onAutoZip={onAutoZip}
                    onExportFhir={onExportFhir}
                    onPrintReport={onPrintReport}
                    isZipping={isZipping}
                    onReset={onReset}
                />
            </Dialog>

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
