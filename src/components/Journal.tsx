
"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import DailySummary from '@/components/DailySummary';
import ThoughtForm from '@/components/ThoughtForm';
import ThoughtList from '@/components/ThoughtList';
import { useCbtJournal, TourSection } from '@/hooks/use-cbt-journal';
import type { ThoughtEntryData, ThoughtEntryFormData, Tour, ClinicalProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AchievementPill } from '@/components/AchievementPill';
import CrisisModal from '@/components/modals/CrisisModal';
import BackupReminderModal from '@/components/modals/BackupReminderModal';
import { generateReportContent, generateL3ReportContent, generateCsvContent, generateFhirObservation } from '@/lib/export';
import FilterControls from '@/components/FilterControls';
import type { UseFormReturn } from 'react-hook-form';
import RuminationModal from '@/components/modals/RuminationModal';
import { Dialog } from '@/components/ui/dialog';
import { Loader2, Target, BookText, Zap, HeartPulse, BarChartHorizontalBig, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { OnboardingTour } from '@/components/OnboardingTour';
import { ClinicalOnboarding } from '@/components/ClinicalOnboarding';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getReflejoState } from '@/lib/reflejo';


type ActiveTab = 'cbt-journal' | 'activation' | 'goals' | 'exposure' | 'wellness';

const NavItem = ({ label, icon: Icon, isActive, onClick, 'data-tour': dataTour }: { label: string, icon: React.ElementType, isActive: boolean, onClick: () => void, 'data-tour'?: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-full h-full", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")} data-tour={dataTour}>
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap truncate">{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
);

const TabLoading = () => (
    <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando modulo...
    </div>
);

const AnalysisDashboard = dynamic(() => import('@/components/AnalysisDashboard'), { loading: TabLoading, ssr: false });
const ExposureMode = dynamic(() => import('@/components/ExposureMode'), { loading: TabLoading, ssr: false });
const ActivationMode = dynamic(() => import('@/components/ActivationMode'), { loading: TabLoading, ssr: false });
const WellnessMode = dynamic(() => import('@/components/WellnessMode'), { loading: TabLoading, ssr: false });
const GoalsMode = dynamic(() => import('@/components/GoalsMode').then((mod) => mod.GoalsMode), { loading: TabLoading, ssr: false });
const PrintReport = dynamic(() => import('@/components/PrintReport'), { ssr: false });


export default function Journal() {
  const { 
    entries, 
    stats, 
    achievements, 
    isLoading, 
    dbStatus,
    addNewEntry, 
    removeEntry, 
    clearJournal, 
    importData,
    analysis,
    crisisConfig,
    updateCrisisConfig,
    crisisDetected,
    setCrisisDetected,
    showBackupReminder,
    setShowBackupReminder,
    filters,
    setFilters,
    pagination,
    loadMoreEntries,
    isSaving,
    exposureState,
    addFearItem,
    updateFearItem,
    deleteFearItem,
    addExposureLog,
    activationState,
    goals,
    ruminationState,
    resetRumination,
    tourState,
    showTours,
    completeTour,
    addGratitudeEntry,
    gratitudeEntries,
    drafts,
    saveThoughtFormDraft,
    clearThoughtFormDraft,
    saveGratitudeDraft,
    clearGratitudeDraft,
    exportEncryptedBackup,
    markBackupCreated,
    sleepEntries,
    addSleepEntry,
    clinicalProfile,
    setClinicalProfile,
  } = useCbtJournal();

  const { t } = useTranslation();
  const formRef = useRef<UseFormReturn<any>>(null);
  const { toast } = useToast();
  const [isZipping, setIsZipping] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab | 'analysis'>('cbt-journal');
  const [tabAction, setTabAction] = useState<any>(null);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  
  useEffect(() => {
    // Open the form automatically if the tour is active, to guide the user.
    if (tourState?.journal === false) {
      setIsFormOpen(true);
    }
  }, [tourState]);

  useEffect(() => {
    if (activeTab !== 'analysis' && tourState && showTours) {
        const tourForTab = activeTab as TourSection;
        const activeTourState = tourState[tourForTab];
        if (typeof activeTourState === 'object' && activeTourState?.seen === false) {
            // Use a timeout to ensure the UI has rendered before starting the tour
            setTimeout(() => {
              const rawTourData = t(`tours.${tourForTab}`);
              if (rawTourData && rawTourData.steps) {
                  const builtTour: Tour = {
                      id: rawTourData.id,
                      steps: rawTourData.steps.map((s: any) => ({
                          id: s.id,
                          targetSelector: s.targetSelector,
                          title: s.title,
                          body: s.body,
                          actionLabel: s.actionLabel,
                          placement: s.placement,
                          requireAction: s.requireAction,
                          skippable: s.skippable,
                      })),
                      autoStart: true,
                  };
                  setActiveTour(builtTour);
              } else {
                  setActiveTour(null);
              }
            }, 500);
        } else {
            setActiveTour(null);
        }
    } else {
        setActiveTour(null);
    }
  }, [activeTab, tourState, showTours, t]);


  const downloadFile = (filename: string, content: string | Blob, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveEntry = async (data: ThoughtEntryData): Promise<boolean> => {
    try {
        const result = await addNewEntry(data);

        if (result.status === 'crisis_detected') {
            return false;
        }

        if (result.status === 'rumination_blocked') {
            return false;
        }

        if (result.status === 'validation_error') {
            toast({
                title: t('toast_error_saving_title'),
                description: result.message,
                variant: "destructive"
            });
            return false;
        }
        
        const reflejo = getReflejoState(stats, analysis, t, { 
            intensity: data.intensity,
            clinicalProfile,
        });

        if (result.reclassifiedLevel) {
            toast({
                title: t('toast_reclassified_title'),
                description: `${reflejo.message} (${t('toast_reclassified_desc', { level: result.reclassifiedLevel })})`,
                variant: 'default'
            });
        } else if (result.distortions.length > 0) {
            toast({
                title: t('toast_distortion_title'),
                description: `${reflejo.message} — ${t('toast_distortion_desc', { distortion: result.distortions[0].name })}`,
                duration: 6000,
            });
        } else {
             toast({
                title: t('toast_session_saved_title'),
                description: reflejo.message,
            });
        }
       
        if (result.newAchievements.length > 0) {
            setTimeout(() => {
                 toast({
                    title: t('toast_achievement_unlocked_title'),
                    description: result.newAchievements.map(a => a.name).join(', '),
                });
            }, 500);
        }

        formRef.current?.reset();
        setIsFormOpen(false); // Close modal on success
        return true;

    } catch (error) {
        console.error(error);
        toast({
            title: t('toast_error_saving_title'),
            description: (error as Error).message || t('toast_error_saving_desc'),
            variant: "destructive"
        });
        return false;
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    // Confirmation is now handled in the AlertDialog component in ThoughtList
    try {
        await removeEntry(id);
        toast({
            title: t('toast_session_deleted_title'),
        });
    } catch (_error) {
         toast({
            title: t('toast_error_deleting_title'),
            variant: "destructive"
        });
    }
  }

  const handleResetJournal = async () => {
    // Confirmation is now handled in the AlertDialog component in Header
    await clearJournal();
    toast({
        title: t('toast_journal_reset_title'),
        description: t('toast_journal_reset_desc'),
    });
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const result = await importData(file);
        if (result.success) {
          toast({ title: t('toast_import_success_title') });
        }
      } catch (error) {
          console.error("Error importing data:", error);
          toast({ title: t('toast_import_error_title'), description: (error as Error).message || t('toast_import_error_desc'), variant: "destructive" });
      } finally {
        // Reset file input to allow re-uploading the same file
        event.target.value = '';
      }
  };
  
  const handleExportJson = async () => {
      try {
        const dataStr = await exportEncryptedBackup();
        downloadFile(`Cognit-backup-cifrado-${new Date().toISOString().split('T')[0]}.json`, dataStr, 'application/json');
        await markBackupCreated();
        toast({ title: t('toast_export_json_title') });
      } catch (error) {
        toast({
          title: t('toast_no_data_to_export_title'),
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
  };
  
  const handleExportCsv = async () => {
      if (stats.total === 0) {
        toast({ title: t('toast_no_data_to_export_title') });
        return;
      }
      const content = await generateCsvContent(entries);
      downloadFile(`CBT-datos-crudos-${new Date().toISOString().split('T')[0]}.csv`, content, 'text/csv;charset=utf-8;');
      toast({ title: t('toast_export_csv_title') });
  };

  const handleExportReport = async () => {
       if (stats.total === 0) {
        toast({ title: t('toast_no_data_to_export_title') });
        return;
      }
      const content = generateReportContent(entries, stats, analysis, t);
      downloadFile(`CBT-Reporte-${new Date().toISOString().split('T')[0]}.md`, content, 'text/markdown');
      toast({ title: t('toast_export_report_title') });
  };

  const handleExportL3Report = async () => {
      const l3Entries = entries.filter(r => r.level === 3 && r.alternativeResponse && !r.__draft);
      if (l3Entries.length === 0) {
        toast({ title: t('toast_no_l3_sessions_title') });
        return;
      }
      const content = generateL3ReportContent(l3Entries, t);
      downloadFile(`CBT-Diario-Exitos-L3-${new Date().toISOString().split('T')[0]}.md`, content, 'text/markdown');
      toast({ title: t('toast_export_l3_title') });
  };
  
  const handleAutoZip = async () => {
      if (isZipping) return;

      const safeEntries = entries || [];
      const safeExposureState = exposureState || { fearLadder: [], logs: [] };
      const safeActivationState = activationState || { values: [], activities: [] };

      const hasBackupableData = stats.total > 0 ||
          safeExposureState.fearLadder.length > 0 ||
          safeExposureState.logs.length > 0 ||
          safeActivationState.values.length > 0 ||
          safeActivationState.activities.length > 0 ||
          goals.length > 0 ||
          gratitudeEntries.length > 0 ||
          sleepEntries.length > 0;

      if (!hasBackupableData) {
          toast({ title: t('toast_no_sessions_for_zip_title') });
          return;
      }
      
      setIsZipping(true);
      toast({ title: t('toast_creating_zip_title') });

      try {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        const today = new Date().toISOString().split('T')[0];

        // 1. Encrypted full backup
        const jsonContent = await exportEncryptedBackup();
        zip.file(`Cognit-backup-cifrado-${today}.json`, jsonContent);
        zip.file(
          `LEEME-PRIVACIDAD-${today}.txt`,
          [
            'Este ZIP contiene un backup JSON cifrado de la boveda completa.',
            'Los reportes Markdown, CSV y FHIR incluidos para lectura humana no estan cifrados.',
            'Tratalos como archivos sensibles si decides compartirlos o almacenarlos fuera de tu dispositivo.'
          ].join('\n')
        );

        // 2. Report MD
        if (safeEntries.length > 0) {
          const reportContent = generateReportContent(safeEntries, stats, analysis, t);
          zip.file(`CBT-report-${today}.md`, reportContent);
        }
        
        // 3. CSV
        if (safeEntries.length > 0) {
          const csvContent = await generateCsvContent(safeEntries);
          zip.file(`CBT-data-${today}.csv`, csvContent);
        }
        
        // 4. L3 Report MD
        const l3Entries = safeEntries.filter(r => r.level === 3 && r.alternativeResponse && !r.__draft);
        if (l3Entries.length > 0) {
          const l3ReportContent = generateL3ReportContent(l3Entries, t);
          zip.file(`CBT-Diario-Exitos-L3-${today}.md`, l3ReportContent);
        }

        // Generate ZIP and download
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadFile(`CBT-Respaldo-${today}.zip`, zipBlob, 'application/zip');
        
        await markBackupCreated();
        setShowBackupReminder(false);
        toast({ title: t('toast_zip_downloaded_title') });
      } catch (error) {
        console.error("Error creating zip file:", error);
        toast({ title: t('toast_zip_error_title'), variant: 'destructive' });
      } finally {
        setIsZipping(false);
      }
  };
  
  const handleExportFhir = () => {
      if (entries.length === 0) {
        toast({ title: t('toast_no_data_to_export_title') });
        return;
      }
      const content = generateFhirObservation(entries, stats, t);
      downloadFile(`CBT-FHIR-Observation-${new Date().toISOString().split('T')[0]}.json`, JSON.stringify(content, null, 2), 'application/fhir+json');
      toast({ title: t('toast_export_fhir_title') });
  };

  const handlePrintReport = () => {
      if (stats.total === 0) {
        toast({ title: t('toast_no_data_to_export_title') });
        return;
      }
      setIsPrinting(true);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);
  };

  const handleMoveToL3 = (data: Partial<ThoughtEntryFormData>) => {
    formRef.current?.reset({
        ...formRef.current.getValues(), // keep current values
        ...data, // overwrite with passed data
        level: 3, // set level to 3
    });
    setIsFormOpen(true);
    toast({ title: t('toast_form_prefilled_l3_title'), description: t('toast_form_prefilled_l3_desc')});
  };

  const handleNavigate = (tab: ActiveTab | 'analysis', actionPayload: any = null) => {
    setActiveTab(tab);
    if(actionPayload) {
      setTabAction(actionPayload);
    }
  }

  const handleActionConsumed = () => {
    setTabAction(null);
  }

  const handleTourComplete = (tourId: string) => {
      completeTour(tourId as TourSection);
      setActiveTour(null);
  };

  const handleClinicalProfileComplete = async (profile: ClinicalProfile) => {
    await setClinicalProfile(profile);
    if (profile !== 'unspecified') {
        const profileLabel = t(`onboarding_quiz.option_${profile}`);
        toast({
            title: t('onboarding_quiz.profile_applied_title'),
            description: t('onboarding_quiz.profile_applied_desc', { profile: profileLabel }),
        });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'cbt-journal':
            return (
                <div className="space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <FilterControls filters={filters} onFilterChange={setFilters} />
                    <ThoughtList 
                        entries={pagination.paginatedEntries} 
                        onDelete={handleDeleteEntry}
                        onLoadMore={loadMoreEntries}
                        onMoveToL3={handleMoveToL3}
                        hasMore={pagination.hasMore}
                        totalEntries={pagination.totalFiltered}
                        negativeStreak={analysis.negativeStreak}
                    />
                </div>
            );
        case 'activation':
            return <ActivationMode tabAction={tabAction} onActionConsumed={handleActionConsumed} />;
        case 'goals':
            return <GoalsMode />;
        case 'exposure':
            return <ExposureMode 
                        fearLadder={exposureState.fearLadder}
                        logs={exposureState.logs}
                        onAddFearItem={addFearItem}
                        onUpdateFearItem={updateFearItem}
                        onDeleteFearItem={deleteFearItem}
                        onAddLog={addExposureLog}
                    />;
        case 'wellness':
            return <WellnessMode 
                        gratitudeEntries={gratitudeEntries}
                        onAddGratitude={addGratitudeEntry}
                        gratitudeDraft={drafts.gratitude}
                        onSaveGratitudeDraft={saveGratitudeDraft}
                        onClearGratitudeDraft={clearGratitudeDraft}
                        onOpenJournal={setIsFormOpen}
                        sleepEntries={sleepEntries}
                        onAddSleepEntry={addSleepEntry}
                   />;
        case 'analysis':
            return <AnalysisDashboard analysis={analysis} stats={stats} entries={entries} clinicalProfile={clinicalProfile} />;
        default:
            return null;
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>{t('loading_journal')}</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {clinicalProfile === undefined && (
        <ClinicalOnboarding onComplete={handleClinicalProfileComplete} />
      )}
      <OnboardingTour activeTour={activeTour} onComplete={handleTourComplete} visible={!!activeTour} onClose={() => setActiveTour(null)} />
      {isPrinting && <PrintReport entries={entries.slice(0, 20)} stats={stats} t={t} />}
      <div id="app-content">
        <Header 
          dbStatus={dbStatus}
          isSaving={isSaving}
          onReset={handleResetJournal}
          onImport={handleImport}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onExportReport={handleExportReport}
          onExportL3Report={handleExportL3Report}
          onAutoZip={handleAutoZip}
          onExportFhir={handleExportFhir}
          onPrintReport={handlePrintReport}
          isZipping={isZipping}
          crisisConfig={crisisConfig}
          updateCrisisConfig={updateCrisisConfig}
          onNavigate={handleNavigate}
        />
        <main className="flex-grow container mx-auto p-2 sm:p-4 md:p-6 pb-24">
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <DailySummary stats={stats} />
            </div>
            
            {achievements.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 my-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    {achievements.map(ach => <AchievementPill key={ach.id} achievement={ach} />)}
                </div>
            )}
            <div className="mt-6">
              {renderContent()}
            </div>
        </main>
      </div>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <ThoughtForm 
          onSubmit={handleSaveEntry} 
          stats={stats} 
          formRef={formRef} 
          onNavigateToAction={() => handleNavigate('activation', { action: 'openActivityForm', payload: { name: formRef.current?.getValues('note') } })}
          clinicalProfile={clinicalProfile}
          isSaving={isSaving}
          goals={goals}
          thoughtFormDraft={drafts.thoughtForm}
          onSaveDraft={saveThoughtFormDraft}
          onClearDraft={clearThoughtFormDraft}
        />
      </Dialog>
      
      {/* Floating Action Button */}
      {activeTab === 'cbt-journal' && (
        <Button 
            onClick={() => setIsFormOpen(true)}
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-30"
            data-tour="new-entry-button"
            aria-label={t('form_title')}
        >
            <Plus className="h-8 w-8" />
        </Button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t z-40">
          <div className="container mx-auto grid grid-cols-5 gap-1 max-w-lg h-16">
              <NavItem label={t('tab_cbt_journal')} icon={BookText} isActive={activeTab === 'cbt-journal'} onClick={() => setActiveTab('cbt-journal')} data-tour="cbt-journal-tab"/>
              <NavItem label={t('tab_activation')} icon={Zap} isActive={activeTab === 'activation'} onClick={() => setActiveTab('activation')} data-tour="activation-tab"/>
              <NavItem label={t('tab_goals')} icon={Target} isActive={activeTab === 'goals'} onClick={() => setActiveTab('goals')} data-tour="goals-tab"/>
              <NavItem label={t('tab_exposure')} icon={BarChartHorizontalBig} isActive={activeTab === 'exposure'} onClick={() => setActiveTab('exposure')} data-tour="exposure-tab"/>
              <NavItem label={t('tab_wellness')} icon={HeartPulse} isActive={activeTab === 'wellness'} onClick={() => setActiveTab('wellness')} data-tour="wellness-tab"/>
          </div>
      </nav>


      <CrisisModal 
        isOpen={crisisDetected}
        onClose={() => setCrisisDetected(false)}
        crisisConfig={crisisConfig}
      />
      <BackupReminderModal
        isOpen={showBackupReminder}
        onClose={() => setShowBackupReminder(false)}
        onBackup={handleAutoZip}
      />
       <RuminationModal 
        isOpen={ruminationState.isRuminationBlocked}
        onClose={(skipped) => {
            if (!skipped) {
                toast({ title: t('toast_cognitive_reset_title') });
                resetRumination();
            }
        }}
      />
    </div>
  );
}
