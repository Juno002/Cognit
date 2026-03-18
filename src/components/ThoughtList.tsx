
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ThoughtEntry, ThoughtEntryFormData } from '@/types';
import { List, Trash2, ChevronsDown, ArrowRight, Link as LinkIcon, Target } from 'lucide-react';
import { formatDate, calculateICC } from '@/lib/utils';
import { NegativeStreakAlert } from './NegativeStreakAlert';
import { useTranslation } from '@/hooks/use-translation';
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ReflejoAvatar from './ReflejoAvatar';
import { getReflejoContextualState } from '@/lib/reflejo';


interface ThoughtListProps {
  entries: ThoughtEntry[];
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  onMoveToL3: (data: Partial<ThoughtEntryFormData>) => void;
  hasMore: boolean;
  totalEntries: number;
  negativeStreak: number;
}

const EntryCard: React.FC<{ entry: ThoughtEntry; onDelete: (id: string) => void; onMoveToL3: (data: Partial<ThoughtEntryFormData>) => void; allEntries: ThoughtEntry[]; }> = ({ entry, onDelete, onMoveToL3, allEntries }) => {
    const { t, locale } = useTranslation();
    const { goals, clinicalProfile } = useCbtJournal();
    const levelEmoji = entry.level === 1 ? '💙' : entry.level === 2 ? '💜' : '💛';
    const iccScore = calculateICC(entry.originalIntensity, entry.finalCredibility);
    
    const linkedGoal = entry.linkedGoalId ? goals.find(g => g.id === entry.linkedGoalId) : null;

    const reflejoState = getReflejoContextualState(entry, allEntries, t, clinicalProfile);

    const handleMoveToL3 = () => {
        onMoveToL3({
            date: entry.date,
            note: entry.note,
            emotion: entry.emotion,
            intensity: entry.intensity,
            tags: entry.tags,
            situation: entry.situation,
            automaticThought: entry.automaticThought,
        });
    };
    
    return (
        <Card className="w-full animate-slide-up" style={{animationDelay: '0.05s'}}>
            <CardHeader className="flex flex-row justify-between items-start pb-3">
                <div>
                    <CardTitle className="text-base">{formatDate(entry.date, t('locale'))}</CardTitle>
                    <p className="text-sm text-muted-foreground">{entry.emotion} - {t('intensity_label_short')}: {entry.intensity}/10</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={entry.__draft ? 'destructive' : 'secondary'}>{levelEmoji} L{entry.level}{entry.__draft ? ` (${t('draft_label')})` : ''}</Badge>
                    {reflejoState && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="outline-none focus:ring-2 focus:ring-primary rounded-full transition-transform hover:scale-110 active:scale-95">
                                    <ReflejoAvatar mode={reflejoState.mode} size={32} showHalo={true} />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="end" className="w-64 p-3 bg-card border-primary/20 shadow-xl">
                                <div className="flex gap-3">
                                    <ReflejoAvatar mode={reflejoState.mode} size={24} showHalo={false} className="mt-1" />
                                    <p className="text-sm font-medium leading-tight">
                                        {reflejoState.message}
                                    </p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={t('delete_entry_aria_label')}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('delete_entry_confirm_title')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('delete_entry_confirm_desc')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-destructive hover:bg-destructive/90">
                                {t('delete_button')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <p className="font-semibold mb-2">{t('reflection_label')}:</p>
                <p className="text-sm text-muted-foreground mb-4">{entry.note}</p>
                
                 {(entry.level === 3 && !entry.__draft) && (
                    <div className="border-t pt-4 mt-4 space-y-3 text-sm">
                        <p><strong>{t('trigger_label')}:</strong> {entry.situation || '—'}</p>
                        <p><strong>{t('auto_thought_label_short')}:</strong> {entry.automaticThought || '—'}</p>
                        <div><strong>{t('thought_intensity_label')}:</strong> {entry.originalIntensity || '—'}/10 → <strong>{t('final_credibility_label_short')}:</strong> {entry.finalCredibility || '—'}/10
                            {iccScore !== null && <Badge variant="outline" className="ml-2" style={{borderColor: 'hsl(var(--icc-metric))', color: 'hsl(var(--icc-metric))'}}>ICC: {iccScore}</Badge>}
                        </div>
                        <p className="text-green-600 dark:text-green-400"><strong>{t('alt_response_label_short')}:</strong> {entry.alternativeResponse || '—'}</p>
                    </div>
                 )}
                
                {entry.level === 2 && entry.creativeLink && (
                     <div className="border-t pt-4 mt-4 space-y-3 text-sm">
                        <p className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4"/>
                            <strong>{t('creative_link_label')}:</strong> 
                            <a href={entry.creativeLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{entry.creativeLink}</a>
                        </p>
                    </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                    {entry.tags && entry.tags.length > 0 && (
                        entry.tags.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)
                    )}
                    {linkedGoal && (
                        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                           <Target className="mr-1 h-3 w-3" />
                           {linkedGoal.title}
                        </Badge>
                    )}
                </div>

            </CardContent>
             {entry.level === 1 && entry.intensity >= 7 && (
                <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleMoveToL3}>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        {t('move_to_l3_button')}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};


const ThoughtList: React.FC<ThoughtListProps> = ({ entries, onDelete, onLoadMore, onMoveToL3, hasMore, totalEntries, negativeStreak }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <List />
            <CardTitle className="text-xl">{t('session_history_title')}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{t('session_count', { count: totalEntries })}</p>
      </CardHeader>
      <CardContent>
        {negativeStreak > 0 && <NegativeStreakAlert days={negativeStreak} />}
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('no_sessions_found')}</p>
        ) : (
          <div className="space-y-4 mt-4">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={onDelete} onMoveToL3={onMoveToL3} allEntries={entries} />
            ))}
          </div>
        )}
      </CardContent>
      {hasMore && (
        <CardFooter className="justify-center">
            <Button variant="ghost" onClick={onLoadMore}>
                <ChevronsDown className="mr-2 h-4 w-4"/>
                {t('load_more_button')}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ThoughtList;
