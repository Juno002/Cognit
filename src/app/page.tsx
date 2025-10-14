
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import DailySummary from '@/components/DailySummary';
import ThoughtForm from '@/components/ThoughtForm';
import ThoughtList from '@/components/ThoughtList';
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import type { ThoughtEntryData, ThoughtEntryFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AchievementPill } from '@/components/AchievementPill';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import ExposureMode from '@/components/ExposureMode';
import CrisisModal from '@/components/modals/CrisisModal';
import BackupReminderModal from '@/components/modals/BackupReminderModal';
import { generateReportContent, generateL3ReportContent, generateCsvContent, generateFhirObservation } from '@/lib/export';
import FilterControls from '@/components/FilterControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JSZip from 'jszip';
import type { UseFormReturn } from 'react-hook-form';
import RuminationModal from '@/components/modals/RuminationModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useVault } from '@/context/vault/VaultProvider';
import { SetupVault } from '@/components/auth/SetupVault';
import { UnlockModal } from '@/components/auth/UnlockModal';


export default function Home() {
  const { hasVault, locked, isChangingPassword } = useVault();
  
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
    lastPrompt,
    exposureState,
    addFearItem,
    updateFearItem,
    deleteFearItem,
    addExposureLog,
    ruminationState,
    resetRumination,
    showTour,
    completeTour,
  } = useCbtJournal();

  const { t } = useTranslation();
  const formRef = useRef<UseFormReturn<any>>(null);
  const { toast } = useToast();
  const [isZipping, setIsZipping] = useState(false);
  
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

  const handleSaveEntry = async (data: ThoughtEntryData) => {
    try {
        const result = await addNewEntry(data);
        
        if (result.reclassifiedLevel) {
            toast({
                title: t('toast_reclassified_title'),
                description: t('toast_reclassified_desc', { level: result.reclassifiedLevel }),
                variant: 'default'
            });
        } else if (result.distortions.length > 0) {
            toast({
                title: t('toast_distortion_title'),
                description: t('toast_distortion_desc', { distortion: result.distortions[0].name }),
                duration: 6000,
            });
        } else {
             toast({
                title: t('toast_session_saved_title'),
                description: t('toast_session_saved_desc'),
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

    } catch (error) {
        if (error instanceof Error && error.message.includes("Crisis risk")) {
            // The hook already set crisisDetected to true, no toast needed
        } else if (error instanceof Error && error.message.includes("Rumination threshold")) {
            // This is handled by the rumination modal
        }
        else {
            console.error(error);
            toast({
                title: t('toast_error_saving_title'),
                description: (error as Error).message || t('toast_error_saving_desc'),
                variant: "destructive"
            });
        }
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    // Confirmation is now handled in the AlertDialog component in ThoughtList
    try {
        await removeEntry(id);
        toast({
            title: t('toast_session_deleted_title'),
        });
    } catch (error) {
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
  
  const handleExportJson = () => {
      if (stats.total === 0) {
        toast({ title: t('toast_no_data_to_export_title') });
        return;
      }
      const dataStr = JSON.stringify({cbtEntries: entries, exposureState: exposureState}, null, 2);
      downloadFile(`CBT-backup-${new Date().toISOString().split('T')[0]}.json`, dataStr, 'application/json');
      toast({ title: t('toast_export_json_title') });
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
      const content = generateReportContent(entries, stats, t);
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
      if (stats.total === 0 && exposureState.fearLadder.length === 0 && exposureState.logs.length === 0) {
          toast({ title: t('toast_no_sessions_for_zip_title') });
          return;
      }
      
      setIsZipping(true);
      toast({ title: t('toast_creating_zip_title') });

      try {
        const zip = new JSZip();
        const today = new Date().toISOString().split('T')[0];
        
        const fullBackup = {
            cbtEntries: entries,
            exposureState: exposureState,
        };

        // 1. Full JSON Backup
        const jsonContent = JSON.stringify(fullBackup, null, 2);
        zip.file(`CBT-data-completo-${today}.json`, jsonContent);

        // 2. Report MD
        if (entries.length > 0) {
          const reportContent = generateReportContent(entries, stats, t);
          zip.file(`CBT-report-${today}.md`, reportContent);
        }
        
        // 3. CSV
        if (entries.length > 0) {
          const csvContent = await generateCsvContent(entries);
          zip.file(`CBT-data-${today}.csv`, csvContent);
        }
        
        // 4. L3 Report MD
        const l3Entries = entries.filter(r => r.level === 3 && r.alternativeResponse && !r.__draft);
        if (l3Entries.length > 0) {
          const l3ReportContent = generateL3ReportContent(l3Entries, t);
          zip.file(`CBT-Diario-Exitos-L3-${today}.md`, l3ReportContent);
        }

        // Generate ZIP and download
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadFile(`CBT-Respaldo-${today}.zip`, zipBlob, 'application/zip');
        
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

  const handleMoveToL3 = (data: Partial<ThoughtEntryFormData>) => {
    formRef.current?.reset({
        ...formRef.current.getValues(), // keep current values
        ...data, // overwrite with passed data
        level: 3, // set level to 3
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: t('toast_form_prefilled_l3_title'), description: t('toast_form_prefilled_l3_desc')});
  };


  if (isLoading || isChangingPassword) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>{isChangingPassword ? "Cambiando contraseña..." : t('loading_journal')}</p>
        </div>
    );
  }

  if (!hasVault) {
    return <SetupVault />;
  }

  if (locked) {
    return <UnlockModal />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
        isZipping={isZipping}
        crisisConfig={crisisConfig}
        updateCrisisConfig={updateCrisisConfig}
        lastPrompt={lastPrompt}
      />
      <main className="flex-grow container mx-auto p-2 sm:p-4 md:p-6">
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <DailySummary stats={stats} />
          </div>
          
          {achievements.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 my-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  {achievements.map(ach => <AchievementPill key={ach.id} achievement={ach} />)}
              </div>
          )}

        <Tabs defaultValue="cbt-journal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cbt-journal" className="flex items-center gap-2">
                    {t('tab_cbt_journal')}
                    <Dialog>
                        <DialogTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('help_cbt_title')}</DialogTitle>
                                <DialogDescription>
                                    {t('help_cbt_desc')}
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </TabsTrigger>
                <TabsTrigger value="exposure" className="flex items-center gap-2">
                    {t('tab_exposure')}
                    <Dialog>
                        <DialogTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('help_erp_title')}</DialogTitle>
                                <DialogDescription>
                                    {t('help_erp_desc')}
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </TabsTrigger>
                <TabsTrigger value="analysis" data-tour="analysis-tab">{t('tab_analysis')}</TabsTrigger>
            </TabsList>
            <TabsContent value="cbt-journal">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
                    <div className="lg:col-span-1 space-y-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                        <ThoughtForm onSubmit={handleSaveEntry} stats={stats} formRef={formRef} />
                        <FilterControls filters={filters} onFilterChange={setFilters} />
                    </div>
                    <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
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
                </div>
            </TabsContent>
             <TabsContent value="exposure">
                <ExposureMode 
                  fearLadder={exposureState.fearLadder}
                  logs={exposureState.logs}
                  onAddFearItem={addFearItem}
                  onUpdateFearItem={updateFearItem}
                  onDeleteFearItem={deleteFearItem}
                  onAddLog={addExposureLog}
                />
            </TabsContent>
            <TabsContent value="analysis">
                <div className="mt-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <AnalysisDashboard analysis={analysis} stats={stats} entries={entries} />
                </div>
            </TabsContent>
        </Tabs>
      </main>
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

    