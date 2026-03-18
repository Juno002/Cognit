
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { ActivationValue, ActivationActivity, Subtask } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus, Edit, Zap, Star, Trophy, Sparkles, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import PomodoroTimer from './cognitive-games/PomodoroTimer';

interface ValueFormProps {
    value?: ActivationValue;
    onSubmit: (data: Omit<ActivationValue, 'id'> | ActivationValue) => void;
    onClose: () => void;
    t: (key: string) => string;
}

const ValueForm: React.FC<ValueFormProps> = ({ value, onSubmit, onClose, t }) => {
    const [name, setName] = useState(value?.name || '');
    const [description, setDescription] = useState(value?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value) {
            onSubmit({ ...value, name, description });
        } else {
            onSubmit({ name, description });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="value-name">{t('activation_value_name_label')}</Label>
                <Input id="value-name" value={name} onChange={e => setName(e.target.value)} placeholder={t('activation_value_name_placeholder')} required />
            </div>
            <div>
                <Label htmlFor="value-desc">{t('description')}</Label>
                <Textarea id="value-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('activation_value_desc_placeholder')} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">{t('cancel')}</Button></DialogClose>
                <Button type="submit">{value ? t('update_button') : t('add_button')}</Button>
            </DialogFooter>
        </form>
    );
};

interface ActivityFormProps {
    activity?: ActivationActivity;
    initialName?: string;
    values: ActivationValue[];
    onSubmit: (data: Omit<ActivationActivity, 'id'> | ActivationActivity) => void;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ activity, initialName, values, onSubmit, onClose, t }) => {
    const [name, setName] = useState(activity?.name || initialName || '');
    const [valueId, setValueId] = useState(activity?.valueId || (values[0]?.id || ''));
    const [pleasure, setPleasure] = useState(activity?.pleasure || 5);
    const [mastery, setMastery] = useState(activity?.mastery || 5);
    const [difficulty, setDifficulty] = useState(activity?.difficulty || 5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activity) {
            onSubmit({ ...activity, name, valueId, pleasure, mastery, difficulty });
        } else {
            onSubmit({ name, valueId, pleasure, mastery, difficulty });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="activity-name">{t('activation_activity_name_label')}</Label>
                <Input id="activity-name" value={name} onChange={e => setName(e.target.value)} placeholder={t('activation_activity_name_placeholder')} required />
            </div>
             <div>
                <Label htmlFor="activity-value">{t('activation_related_value_label')}</Label>
                <select id="activity-value" value={valueId} onChange={e => setValueId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {values.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>
            <div>
                <Label>{t('activation_pleasure_label', { value: pleasure })}</Label>
                <Slider value={[pleasure]} onValueChange={([val]) => setPleasure(val)} min={0} max={10} step={1} />
            </div>
            <div>
                <Label>{t('activation_mastery_label', { value: mastery })}</Label>
                <Slider value={[mastery]} onValueChange={([val]) => setMastery(val)} min={0} max={10} step={1} />
            </div>
            <div>
                <Label>{t('activation_difficulty_label', { value: difficulty })}</Label>
                <Slider value={[difficulty]} onValueChange={([val]) => setDifficulty(val)} min={1} max={10} step={1} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">{t('cancel')}</Button></DialogClose>
                <Button type="submit">{activity ? t('update_button') : t('add_button')}</Button>
            </DialogFooter>
        </form>
    );
};

const SubtaskList: React.FC<{
    activity: ActivationActivity;
    onAddSubtask: (activityId: string, name: string) => void;
    onToggleSubtask: (activityId: string, subtaskId: string) => void;
    t: (key: string, options?: any) => string;
}> = ({ activity, onAddSubtask, onToggleSubtask, t }) => {
    const [newSubtask, setNewSubtask] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const subtasks = activity.subtasks || [];
    const completedCount = subtasks.filter(st => st.completed).length;
    const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

    const handleAdd = () => {
        if(newSubtask.trim()) {
            onAddSubtask(activity.id, newSubtask.trim());
            setNewSubtask('');
        }
    };

    const handleAutoSplit = () => {
        const microSteps = [
            `Preparar materiales para: ${activity.name}`,
            `Empezar solo 5 minutos de: ${activity.name}`,
            `Completar primera fase de: ${activity.name}`,
            `Revisar progreso de: ${activity.name}`
        ];
        microSteps.forEach(step => onAddSubtask(activity.id, step));
        setIsExpanded(true);
    };

    return (
        <div className="mt-2 space-y-2">
            <Progress value={progress} className="h-2" />
            {isExpanded && (
                <div className="space-y-2 border-t pt-2">
                     <ul className="space-y-1">
                        {subtasks.map(st => (
                            <li key={st.id} className="flex items-center gap-2 text-sm">
                                <Checkbox id={`subtask-${st.id}`} checked={st.completed} onCheckedChange={() => onToggleSubtask(activity.id, st.id)} />
                                <Label htmlFor={`subtask-${st.id}`} className={st.completed ? 'line-through text-muted-foreground' : ''}>{st.name}</Label>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <Input 
                            value={newSubtask} 
                            onChange={e => setNewSubtask(e.target.value)} 
                            placeholder={t('activation_add_subtask_placeholder')}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <Button size="sm" onClick={handleAdd}>{t('add_button')}</Button>
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ChevronsUp className="mr-2 h-4 w-4" /> : <ChevronsDown className="mr-2 h-4 w-4" />}
                    {t('activation_subtasks_button')} ({completedCount}/{subtasks.length})
                </Button>
                
                {(activity.difficulty || 0) >= 7 && subtasks.length === 0 && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs border-dashed border-primary text-primary hover:bg-primary/5"
                        onClick={handleAutoSplit}
                    >
                        <Sparkles className="mr-2 h-3 w-3" />
                        {t('activation_auto_split_button')}
                    </Button>
                )}
            </div>
        </div>
    );
};


const ActivationMode = ({ tabAction, onActionConsumed }: { tabAction: any; onActionConsumed: () => void; }) => {
    const { t } = useTranslation();
    const { activationState, addActivationValue, updateActivationValue, deleteActivationValue, addActivationActivity, updateActivationActivity, deleteActivationActivity, addSubtask, toggleSubtask } = useCbtJournal();

    const [isValueFormOpen, setIsValueFormOpen] = useState(false);
    const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
    const [editingValue, setEditingValue] = useState<ActivationValue | undefined>(undefined);
    const [editingActivity, setEditingActivity] = useState<ActivationActivity | undefined>(undefined);
    const [prefilledActivityName, setPrefilledActivityName] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        if (tabAction?.action === 'openActivityForm') {
            setPrefilledActivityName(tabAction.payload?.name);
            setIsActivityFormOpen(true);
            onActionConsumed(); // Consume the action once handled
        }
    }, [tabAction, onActionConsumed]);

    const activitiesByValue = useMemo(() => {
        const grouped: Record<string, ActivationActivity[]> = {};
        activationState.activities.forEach(activity => {
            if (!grouped[activity.valueId]) {
                grouped[activity.valueId] = [];
            }
            grouped[activity.valueId].push(activity);
        });
        return grouped;
    }, [activationState.activities]);

    const closeActivityForm = () => {
        setIsActivityFormOpen(false);
        setEditingActivity(undefined);
        setPrefilledActivityName(undefined);
    };

    return (
        <div className="mt-6 space-y-6">
            <Dialog open={isValueFormOpen} onOpenChange={setIsValueFormOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingValue ? t('activation_edit_value_title') : t('activation_add_value_title')}</DialogTitle>
                    </DialogHeader>
                    <ValueForm
                        value={editingValue}
                        onSubmit={(data) => {
                            if ('id' in data) {
                                updateActivationValue(data);
                            } else {
                                addActivationValue(data);
                            }
                        }}
                        onClose={() => { setIsValueFormOpen(false); setEditingValue(undefined); }}
                        t={t}
                    />
                </DialogContent>
            </Dialog>

             <Dialog open={isActivityFormOpen} onOpenChange={closeActivityForm}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingActivity ? t('activation_edit_activity_title') : t('activation_add_activity_title')}</DialogTitle>
                    </DialogHeader>
                    <ActivityForm
                        activity={editingActivity}
                        initialName={prefilledActivityName}
                        values={activationState.values}
                        onSubmit={(data) => {
                            if ('id' in data) {
                                updateActivationActivity(data);
                            } else {
                                addActivationActivity(data);
                            }
                        }}
                        onClose={closeActivityForm}
                        t={t}
                    />
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="text-primary" />
                        {t('tab_activation')}
                    </CardTitle>
                    <CardDescription>
                        {t('help_activation_desc')}
                    </CardDescription>
                </CardHeader>
                 <CardFooter className="flex-col sm:flex-row gap-4">
                    <Button onClick={() => { setEditingActivity(undefined); setPrefilledActivityName(undefined); setIsActivityFormOpen(true); }} disabled={activationState.values.length === 0} className="w-full sm:w-auto" data-tour="add-activity-button">
                        <Plus className="mr-2 h-4 w-4" /> {t('activation_add_activity_action')}
                    </Button>
                    <PomodoroTimer />
                </CardFooter>
            </Card>

            <Card>
                 <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-grow">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="text-yellow-500" />
                            {t('activation_values_title')}
                        </CardTitle>
                        <CardDescription>{t('activation_values_desc')}</CardDescription>
                    </div>
                    <Button onClick={() => { setEditingValue(undefined); setIsValueFormOpen(true); }} className="shrink-0" data-tour="add-value-button">
                        <Plus className="mr-2 h-4 w-4" /> {t('add_button')}
                    </Button>
                </CardHeader>
                <CardContent>
                     {activationState.values.length > 0 ? (
                        <ul className="space-y-2">
                            {activationState.values.map(v => (
                                <li key={v.id} className="p-3 border rounded-md flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold">{v.name}</h4>
                                        <p className="text-sm text-muted-foreground">{v.description}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingValue(v); setIsValueFormOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteActivationValue(v.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">{t('activation_add_first_value_message')}</p>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-grow">
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="text-green-500" />
                            {t('activation_activities_title')}
                        </CardTitle>
                        <CardDescription>{t('activation_activities_desc')}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {activationState.values.length > 0 ? (
                        activationState.values.map(value => (
                            <div key={value.id} className="mb-6">
                                <h3 className="font-bold text-lg text-primary mb-2">{value.name}</h3>
                                {activitiesByValue[value.id] && activitiesByValue[value.id].length > 0 ? (
                                    <ul className="space-y-3">
                                        {activitiesByValue[value.id].map(activity => (
                                            <li key={activity.id} className="p-3 border rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">{activity.name}</p>
                                                        <div className="flex gap-4 text-sm mt-1">
                                                            <span title={t('activation_pleasure_label_short')}><Star className="inline-block h-4 w-4 text-yellow-400 mr-1" />{activity.pleasure}/10</span>
                                                            <span title={t('activation_mastery_label_short')}><Trophy className="inline-block h-4 w-4 text-green-500 mr-1" />{activity.mastery}/10</span>
                                                            <span title={t('activation_difficulty_label_short')} className={activity.difficulty >= 7 ? 'text-red-500 font-medium' : ''}><Zap className="inline-block h-4 w-4 mr-1" />{activity.difficulty}/10</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingActivity(activity); setIsActivityFormOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteActivationActivity(activity.id)}><Trash2 className="h-4 w-4"/></Button>
                                                    </div>
                                                </div>
                                                 <SubtaskList activity={activity} onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} t={t} />
                                            </li>
                                        ))}
                                    </ul>
                                 ) : (
                                    <p className="text-sm text-muted-foreground">{t('activation_no_activities_for_value')}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">{t('activation_add_value_to_add_activity')}</p>
                    )}
                </CardContent>
            </Card>

        </div>
    );
};

export default ActivationMode;
