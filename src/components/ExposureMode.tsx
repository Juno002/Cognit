
"use client";

import React, { useState, useMemo } from 'react';
import type { FearItem, ExposureLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from '@/hooks/use-translation';

interface ExposureModeProps {
    fearLadder: FearItem[];
    logs: ExposureLog[];
    onAddFearItem: (item: Omit<FearItem, 'id' | 'completed'>) => void;
    onUpdateFearItem: (item: FearItem) => void;
    onDeleteFearItem: (id: string) => void;
    onAddLog: (log: Omit<ExposureLog, 'id'| 'date'>) => void;
}

const FearItemForm: React.FC<{
    item?: FearItem;
    onSubmit: (data: Omit<FearItem, 'id' | 'completed'> | FearItem) => void;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}> = ({ item, onSubmit, onClose, t }) => {
    const [description, setDescription] = useState(item?.description || '');
    const [rating, setRating] = useState(item?.rating || 50);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (item) {
            onSubmit({ ...item, description, rating });
        } else {
            onSubmit({ description, rating });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="fear-desc">{t('fear_desc_label')}</Label>
                <Input id="fear-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('fear_desc_placeholder')} required />
            </div>
            <div>
                <Label htmlFor="fear-rating">{t('anxiety_level_label', { rating })}</Label>
                <Slider id="fear-rating" value={[rating]} onValueChange={([val]) => setRating(val)} min={0} max={100} step={5} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{item ? t('update_button') : t('add_button')}</Button>
            </DialogFooter>
        </form>
    );
};

const ExposureLogForm: React.FC<{
    fearItem: FearItem;
    onSubmit: (log: Omit<ExposureLog, 'id'| 'date'>) => void;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}> = ({ fearItem, onSubmit, onClose, t }) => {
    const [initialAnxiety, setInitialAnxiety] = useState(fearItem.rating);
    const [finalAnxiety, setFinalAnxiety] = useState(30);
    const [durationMinutes, setDurationMinutes] = useState(15);
    const [notes, setNotes] = useState('');
    const [catastrophicPrediction, setCatastrophicPrediction] = useState('');
    const [realOutcome, setRealOutcome] = useState('');
    const [safetyBehaviorsAvoided, setSafetyBehaviorsAvoided] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            fearItemId: fearItem.id,
            initialAnxiety,
            finalAnxiety,
            durationMinutes,
            notes,
            catastrophicPrediction,
            realOutcome,
            safetyBehaviorsAvoided
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg">{fearItem.description}</h3>
            <div>
                <Label>{t('initial_anxiety_label', { anxiety: initialAnxiety })}</Label>
                <Slider value={[initialAnxiety]} onValueChange={([val]) => setInitialAnxiety(val)} min={0} max={100} step={5} />
            </div>
            <div>
                <Label>{t('final_anxiety_label', { anxiety: finalAnxiety })}</Label>
                <Slider value={[finalAnxiety]} onValueChange={([val]) => setFinalAnxiety(val)} min={0} max={100} step={5} />
            </div>
             <div>
                <Label>{t('duration_label', { duration: durationMinutes })}</Label>
                <Slider value={[durationMinutes]} onValueChange
                ={([val]) => setDurationMinutes(val)} min={5} max={120} step={5} />
            </div>
             <div>
                <Label htmlFor="log-notes">{t('notes_label')}</Label>
                <Textarea id="log-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_placeholder')} />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        {t('erp_advanced_section_title')}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                    <div>
                        <Label htmlFor="catastrophic-prediction">{t('erp_catastrophic_prediction_label')}</Label>
                        <Textarea id="catastrophic-prediction" value={catastrophicPrediction} onChange={e => setCatastrophicPrediction(e.target.value)} placeholder={t('erp_catastrophic_prediction_placeholder')} />
                    </div>
                    <div>
                        <Label htmlFor="real-outcome">{t('erp_real_outcome_label')}</Label>
                        <Textarea id="real-outcome" value={realOutcome} onChange={e => setRealOutcome(e.target.value)} placeholder={t('erp_real_outcome_placeholder')} />
                    </div>
                     <div>
                        <Label htmlFor="safety-behaviors">{t('erp_safety_behaviors_label')}</Label>
                        <Textarea id="safety-behaviors" value={safetyBehaviorsAvoided} onChange={e => setSafetyBehaviorsAvoided(e.target.value)} placeholder={t('erp_safety_behaviors_placeholder')} />
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>


            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('save_log_button')}</Button>
            </DialogFooter>
        </form>
    )
};

const ExposureMode: React.FC<ExposureModeProps> = ({
    fearLadder,
    logs,
    onAddFearItem,
    onUpdateFearItem,
    onDeleteFearItem,
    onAddLog
}) => {
    const { t, locale } = useTranslation();
    const [isFearFormOpen, setIsFearFormOpen] = useState(false);
    const [isLogFormOpen, setIsLogFormOpen] = useState<FearItem | null>(null);
    const [editingFearItem, setEditingFearItem] = useState<FearItem | undefined>(undefined);
    const dateLocale = locale === 'es' ? es : enUS;

    const sortedFearLadder = useMemo(() => {
        return [...fearLadder].sort((a, b) => a.rating - b.rating);
    }, [fearLadder]);

    const progressData = useMemo(() => {
        if (logs.length === 0) return [];
        const dataByItem: Record<string, {name: string, data: {date: string, timestamp: number, anxiety: number}[]}> = {};
        
        logs.forEach(log => {
            const fearItem = fearLadder.find(f => f.id === log.fearItemId);
            if (!fearItem) return;
            
            if (!dataByItem[log.fearItemId]) {
                dataByItem[log.fearItemId] = { name: fearItem.description.substring(0, 20) + (fearItem.description.length > 20 ? '...' : ''), data: [] };
            }
            dataByItem[log.fearItemId].data.push({
                date: format(new Date(log.date), 'dd MMM', { locale: dateLocale }),
                timestamp: new Date(log.date).getTime(),
                anxiety: log.finalAnxiety
            });
        });

        return Object.values(dataByItem).map(item => ({
            name: item.name,
            data: item.data.sort((a,b) => a.timestamp - b.timestamp)
        }));

    }, [logs, fearLadder, dateLocale]);

    const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--icc-metric))', 'hsl(var(--destructive))'];

    return (
        <div className="grid lg:grid-cols-2 gap-6 items-start mt-6">
            <Dialog open={isFearFormOpen} onOpenChange={setIsFearFormOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFearItem ? t('edit_fear_item_title') : t('add_fear_item_title')}</DialogTitle>
                    </DialogHeader>
                    <FearItemForm
                        item={editingFearItem}
                        onSubmit={(data) => {
                            if ('id' in data) {
                                onUpdateFearItem(data);
                            } else {
                                onAddFearItem(data);
                            }
                        }}
                        onClose={() => {
                            setIsFearFormOpen(false);
                            setEditingFearItem(undefined);
                        }}
                        t={t}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={!!isLogFormOpen} onOpenChange={(open) => !open && setIsLogFormOpen(null)}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('log_exposure_session_title')}</DialogTitle>
                    </DialogHeader>
                    {isLogFormOpen && (
                         <ExposureLogForm
                            fearItem={isLogFormOpen}
                            onSubmit={onAddLog}
                            onClose={() => setIsLogFormOpen(null)}
                            t={t}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('fear_hierarchy_title')}</CardTitle>
                            <CardDescription>{t('fear_hierarchy_desc')}</CardDescription>
                        </div>
                         <Button onClick={() => { setEditingFearItem(undefined); setIsFearFormOpen(true); }} data-tour="add-fear-item-button">
                            <Plus className="mr-2 h-4 w-4" /> {t('add_button')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                       <ul className="space-y-2">
                            {sortedFearLadder.length > 0 ? sortedFearLadder.map(item => (
                                <li key={item.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox id={`fear-${item.id}`} checked={item.completed} onCheckedChange={(checked) => onUpdateFearItem({ ...item, completed: !!checked })} />
                                    <div className="flex-grow">
                                        <label htmlFor={`fear-${item.id}`} className="font-medium">{item.description}</label>
                                        <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                                            <div className="bg-destructive h-2.5 rounded-full" style={{ width: `${item.rating}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="w-12 text-right font-bold">{item.rating}</div>
                                    <Button size="sm" variant="outline" onClick={() => setIsLogFormOpen(item)} data-tour="log-exposure-button">{t('log_button')}</Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingFearItem(item); setIsFearFormOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeleteFearItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                </li>
                            )) : (
                                <p className="text-center text-muted-foreground py-4">{t('add_first_fear_item_message')}</p>
                            )}
                       </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('exposure_progress_title')}</CardTitle>
                        <CardDescription>{t('exposure_progress_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {logs.length > 0 ? (
                             <ResponsiveContainer width="100%" height={250}>
                                <LineChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    {progressData.map((s, i) => (
                                        <Line dataKey="anxiety" data={s.data} name={s.name} key={s.name} stroke={colors[i % colors.length]} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                         ) : (
                             <p className="text-center text-muted-foreground py-4">{t('log_sessions_to_see_progress')}</p>
                         )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('latest_exposure_logs_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {logs.slice(0, 5).map(log => {
                                const fearItem = fearLadder.find(f => f.id === log.fearItemId);
                                return (
                                <li key={log.id} className="text-sm p-3 border rounded-md">
                                    <p className="font-semibold">{fearItem?.description || t('deleted_item')}</p>
                                    <p className="text-muted-foreground">{format(new Date(log.date), "d 'de' MMMM, yyyy", { locale: dateLocale })} - {t('minutes_short', {count: log.durationMinutes})}</p>
                                    <p>{t('anxiety_label_simple')}: <span className="font-bold">{log.initialAnxiety}</span> → <span className="font-bold text-success">{log.finalAnxiety}</span></p>
                                    {log.notes && <p className="mt-1 pt-1 border-t text-xs italic">{t('note_label')}: {log.notes}</p>}
                                    
                                    {log.catastrophicPrediction && log.realOutcome && (
                                        <div className="mt-2 pt-2 border-t space-y-1 text-xs">
                                            <p><strong>{t('erp_catastrophic_prediction_label_short')}:</strong> {log.catastrophicPrediction}</p>
                                            <p className="text-green-600"><strong>{t('erp_real_outcome_label_short')}:</strong> {log.realOutcome}</p>
                                        </div>
                                    )}
                                    {log.safetyBehaviorsAvoided && (
                                         <p className="mt-2 pt-2 border-t text-xs"><strong>{t('erp_safety_behaviors_avoided_short')}:</strong> {log.safetyBehaviorsAvoided}</p>
                                    )}
                                </li>
                            )})}
                             {logs.length === 0 && <p className="text-center text-muted-foreground py-4">{t('no_logs_yet')}</p>}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ExposureMode;
