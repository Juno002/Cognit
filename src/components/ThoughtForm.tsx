
"use client";

import React, { useState, useEffect, useMemo, useImperativeHandle, Ref } from 'react';
import { z } from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { BookPlus, X, Volume2, Mic, Link as LinkIcon, HelpCircle, Target, Zap } from 'lucide-react';
import type { ThoughtEntryData, ThoughtEntryFormData } from '@/types';
import { todayISO } from '@/lib/utils';
import { MIN_L3_RESPONSE_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import type { JournalStats } from '@/hooks/use-cbt-journal';
import { getContextualPrompt } from '@/lib/prompts';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';


const formSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria."),
  level: z.preprocess((val) => Number(val), z.number().min(1).max(3)),
  note: z.string().min(1, "La reflexión es obligatoria."),
  situation: z.string().optional(),
  automaticThought: z.string().optional(),
  originalIntensity: z.number().min(1).max(10),
  alternativeResponse: z.string().optional(),
  creativeLink: z.string().url("Debe ser un enlace válido.").optional().or(z.literal('')),
  finalCredibility: z.number().min(1).max(10),
  emotion: z.string().min(1, "La emoción es obligatoria."),
  intensity: z.number().min(1).max(10),
  tags: z.array(z.string()),
  linkedGoalId: z.string().optional(),
}).refine(data => {
    if (data.level === 3) {
      if (!data.originalIntensity || !data.finalCredibility) return true;
      if (data.originalIntensity < data.finalCredibility) {
        return false;
      }
    }
    return true;
  }, {
    message: "La creencia final no puede ser mayor que la intensidad original.",
    path: ["finalCredibility"],
  }).refine(data => {
      if (data.level === 3) {
          return data.alternativeResponse && data.alternativeResponse.length >= MIN_L3_RESPONSE_LENGTH;
      }
      return true;
  }, {
      message: `La respuesta alternativa debe tener al menos ${MIN_L3_RESPONSE_LENGTH} caracteres para L3.`,
      path: ["alternativeResponse"],
  }).refine(data => {
    if (data.level === 3) {
        return data.situation && data.situation.length > 0;
    }
    return true;
  }, {
    message: 'La situación es requerida para el Nivel 3.',
    path: ["situation"]
  }).refine(data => {
    if (data.level === 3) {
        return data.automaticThought && data.automaticThought.length > 0;
    }
    return true;
  }, {
    message: 'El pensamiento automático es requerido para el Nivel 3.',
    path: ["automaticThought"]
  });

type FormValues = z.infer<typeof formSchema>;

interface ThoughtFormProps {
  onSubmit: (data: ThoughtEntryData) => void;
  stats: JournalStats;
  formRef: Ref<UseFormReturn<FormValues>>;
  onOpenChange: (open: boolean) => void;
  onNavigateToAction: () => void;
}

type TextareaFieldNames = "note" | "situation" | "automaticThought" | "alternativeResponse";


const SpeechButton: React.FC<{ field: TextareaFieldNames, form: UseFormReturn<FormValues> }> = ({ field, form }) => {
    const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
        onResult: (transcript) => {
            const currentValue = form.getValues(field) || '';
            form.setValue(field, currentValue + transcript + '. ', { shouldValidate: true, shouldDirty: true });
        }
    });

    if (!isSupported) return null;

    return (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={isListening ? stopListening : startListening}
            className={cn("h-8 w-8 shrink-0", isListening && "text-destructive animate-pulse")}
            aria-label={isListening ? "Detener dictado" : "Iniciar dictado"}
        >
            <Mic className="h-4 w-4" />
        </Button>
    );
};


const ThoughtForm: React.FC<ThoughtFormProps> = ({ onSubmit, stats, formRef, onOpenChange, onNavigateToAction }) => {
  const { isSaving, goals } = useCbtJournal();
  const { t } = useTranslation();
  const [level, setLevel] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const EMOTIONS: {emoji: string, label: string}[] = useMemo(() => t('emotions'), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      date: todayISO(),
      level: 1,
      note: '',
      situation: '',
      automaticThought: '',
      originalIntensity: 7,
      alternativeResponse: '',
      creativeLink: '',
      finalCredibility: 3,
      emotion: '',
      intensity: 5,
      tags: [],
      linkedGoalId: '',
    },
  });

  useImperativeHandle(formRef, () => form);

  const watchedLevel = form.watch('level');
  const watchedEmotion = form.watch('emotion');
  const watchedIntensity = form.watch('intensity');
  const inProgressGoals = useMemo(() => goals.filter(g => g.status === 'in-progress'), [goals]);
  const showActivationSuggestion = useMemo(() => ['Tired', 'Sad', 'Cansado', 'Triste'].includes(watchedEmotion) && watchedIntensity < 6 && watchedLevel < 3, [watchedEmotion, watchedIntensity, watchedLevel]);

  const fieldStyles = (fieldValue?: string) =>
    cn(
        "transition-all duration-300",
        fieldValue && fieldValue.length > 10 ? 'border-success' : 'border-input'
    );
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(handleFormSubmit)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [form]);


  useEffect(() => {
    const newPrompt = getContextualPrompt(watchedLevel, stats, t);
    setPrompt(newPrompt);
  }, [watchedLevel, stats, t]);
  
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'level') {
        const newLevel = value.level || 1;
        if (newLevel !== level) {
            setLevel(newLevel);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, level]);

  const handleFormSubmit = (values: FormValues) => {
    
    const entryData: ThoughtEntryData = {
        ...values,
        promptUsed: prompt,
        __draft: false,
    };
    onSubmit(entryData);
  };
  
  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !form.getValues('tags').includes(newTag)) {
        form.setValue('tags', [...form.getValues('tags'), newTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', form.getValues('tags').filter(tag => tag !== tagToRemove));
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = 'es-ES';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };
  
  const handleNavigateClick = () => {
    onOpenChange(false); // Close the form dialog
    onNavigateToAction(); // Trigger navigation
  };

  return (
    <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookPlus className="text-primary" />
            {t('form_title')}
          </DialogTitle>
          <DialogDescription>{t('form_description')}</DialogDescription>
        </DialogHeader>
        <div className="bg-accent/50 border-l-4 border-accent p-4 rounded-md flex justify-between items-center">
            <span className="text-sm italic">{prompt}</span>
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                <Button variant="ghost" size="icon" onClick={handleSpeak} className="h-7 w-7 shrink-0" aria-label={t('speak_prompt_aria')}>
                    {isSpeaking ? <X className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
            )}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>📅 {t('date_label')}</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>🎯 {t('level_label')}</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                            <FormControl>
                            <SelectTrigger data-tour="level-select">
                                <SelectValue placeholder={t('level_placeholder')} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="1">💙 {t('level1_option')}</SelectItem>
                                <SelectItem value="2">💜 {t('level2_option')}</SelectItem>
                                <SelectItem value="3">💛 {t('level3_option')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>📝 {t('reflection_label')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Textarea placeholder={t('reflection_placeholder')} {...field} className={cn("pr-10", fieldStyles(field.value))}/>
                        <div className="absolute bottom-1 right-1">
                           <SpeechButton field="note" form={form} />
                        </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showActivationSuggestion && (
                <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-3 rounded-r-md text-sm">
                    <p className="font-semibold">{t('proactive_activation_title')}</p>
                    <p className="mb-2">{t('proactive_activation_desc')}</p>
                    <Button type="button" size="sm" variant="outline" onClick={handleNavigateClick}>
                        <Zap className="mr-2 h-4 w-4" />
                        {t('proactive_activation_action')}
                    </Button>
                </div>
            )}
            
             <div className={cn("form-group-hidden", watchedLevel === 2 && "form-group-visible")}>
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                  <AccordionItem value="item-1">
                      <AccordionTrigger>
                          {t('creative_expression_title')}
                      </AccordionTrigger>
                      <AccordionContent>
                         <div className="space-y-4 pt-4">
                          <FormField
                              control={form.control}
                              name="creativeLink"
                              render={({ field }) => (
                                  <FormItem>
                                      <div className="flex items-center gap-2">
                                          <FormLabel>🔗 {t('creative_link_label')}</FormLabel>
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger asChild>
                                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                      <p className="max-w-xs">{t('creative_link_tooltip')}</p>
                                                  </TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                      </div>
                                  <FormControl>
                                      <div className="relative flex items-center">
                                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" placeholder="https://..." {...field} />
                                      </div>
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                         </div>
                      </AccordionContent>
                  </AccordionItem>
                </Accordion>
             </div>


            <div className={cn("form-group-hidden", watchedLevel === 3 && "form-group-visible")}>
              <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    {t('cognitive_restructuring_title')}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                       <div className="space-y-4 rounded-md border border-dashed p-4">
                          <h4 className="text-sm font-semibold">{t('step1_title')}</h4>
                          <FormField
                            control={form.control}
                            name="situation"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('situation_label')}</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Textarea className={cn("min-h-[50px] pr-10", fieldStyles(field.value))} placeholder={t('situation_placeholder')} {...field} />
                                        <div className="absolute bottom-1 right-1">
                                            <SpeechButton field="situation" form={form} />
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                          />
                          <FormField
                              control={form.control}
                              name="automaticThought"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>{t('auto_thought_label')}</FormLabel>
                                  <FormControl>
                                      <div className="relative">
                                          <Textarea className={cn("min-h-[80px] pr-10", fieldStyles(field.value))} placeholder={t('auto_thought_placeholder')} {...field} />
                                          <div className="absolute bottom-1 right-1">
                                              <SpeechButton field="automaticThought" form={form} />
                                          </div>
                                      </div>
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                            control={form.control}
                            name="originalIntensity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('original_intensity_label', { value: field.value })}</FormLabel>
                                <FormControl>
                                    <Slider
                                        aria-label={t('original_intensity_aria')}
                                        onValueChange={(value) => field.onChange(value[0])}
                                        value={[field.value]}
                                        min={1} max={10} step={1}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                          />
                       </div>

                       <div className="space-y-4 rounded-md border border-dashed p-4">
                          <h4 className="text-sm font-semibold">{t('step2_title')}</h4>
                           <FormField
                              control={form.control}
                              name="alternativeResponse"
                              render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <FormLabel>{t('alt_response_label')}</FormLabel>
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger asChild>
                                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                      <p className="max-w-xs">{t('alt_response_tooltip')}</p>
                                                  </TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                      </div>
                                    </div>
                                  <FormControl>
                                      <div className="relative">
                                          <Textarea className={cn("min-h-[80px] pr-10", fieldStyles(field.value))} placeholder={t('alt_response_placeholder')} {...field} />
                                          <div className="absolute bottom-1 right-1">
                                              <SpeechButton field="alternativeResponse" form={form} />
                                          </div>
                                      </div>
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="finalCredibility"
                              render={({ field }) => (
                                  <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormLabel>{t('final_credibility_label', { value: field.value })}</FormLabel>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{t('final_credibility_tooltip')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <FormControl>
                                      <Slider
                                          aria-label={t('final_credibility_aria')}
                                          onValueChange={(value) => field.onChange(value[0])}
                                          value={[field.value]}
                                          min={1} max={10} step={1}
                                      />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                       </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>


            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-semibold">{t('emotion_context_title')}</h3>
                <FormField
                    control={form.control}
                    name="emotion"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>😊 {t('emotion_scale_label')}</FormLabel>
                         <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                            {EMOTIONS.map((e) => (
                                <Button
                                    key={e.label}
                                    type="button"
                                    variant={field.value === e.label ? "default" : "outline"}
                                    onClick={() => field.onChange(e.label)}
                                    className="h-auto py-2 flex flex-col items-center gap-1 text-xs sm:text-sm"
                                >
                                    <span className="text-xl sm:text-2xl">{e.emoji}</span>
                                    <span className="">{e.label}</span>
                                </Button>
                            ))}
                        </div>
                        <FormControl>
                            <Input placeholder={t('emotion_placeholder')} {...field} value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="intensity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>📊 {t('emotion_intensity_label', { value: field.value })}</FormLabel>
                        <FormControl>
                             <Slider
                                aria-label={t('emotion_intensity_aria')}
                                onValueChange={(value) => field.onChange(value[0])}
                                value={[field.value]}
                                min={1} max={10} step={1}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>🏷️ {t('tags_label')}</FormLabel>
                         <div className="flex items-center gap-2">
                            <Input 
                                placeholder={t('tags_placeholder')}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addTag}>{t('add_tag_button')}</Button>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.map(tag => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="ml-2" aria-label={t('remove_tag_aria', { tag })}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                         </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                {inProgressGoals.length > 0 && (
                    <FormField
                        control={form.control}
                        name="linkedGoalId"
                        render={({ field }) => (
                            <FormItem data-tour="journal-link-goal">
                                <FormLabel className="flex items-center gap-2"><Target className="h-4 w-4" />{t('goal_associate_label')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('goal_associate_placeholder')} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="">{t('goal_associate_none')}</SelectItem>
                                        {inProgressGoals.map(goal => (
                                            <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? t('saving_button') : `💾 ${t('save_button')}`}
                </Button>
            </DialogFooter>
            <p className="hidden sm:block text-xs text-center text-muted-foreground">{t('shortcut_save')}</p>
          </form>
        </Form>
    </DialogContent>
  );
};

export default ThoughtForm;
