
"use client";

import React, { useState, useMemo } from 'react';
import type { SleepEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bed, BarChart, History, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { todayISO, formatDate } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { cn } from '@/lib/utils';

type SleepEntryForm = Omit<SleepEntry, 'id' | 'sleepEfficiencyPct' | 'crossesMidnight' | 'timeInBedMin' | 'timeAsleepMin' | 'createdAt' | 'updatedAt' | 'linkedJournalEntryId'>;


const StarRating: React.FC<{ value: number; onValueChange: (value: number) => void }> = ({ value, onValueChange }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    type="button"
                    key={star}
                    onClick={() => onValueChange(star)}
                    className="p-1"
                    aria-label={`Rate ${star} out of 5`}
                >
                    <Star className={cn("h-6 w-6", star <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                </button>
            ))}
        </div>
    );
};


interface SleepDiaryProps {
  entries: SleepEntry[];
  onAddEntry: (data: SleepEntryForm) => void;
}

const SleepDiary: React.FC<SleepDiaryProps> = ({ entries, onAddEntry }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getYesterdayISO = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  const [formData, setFormData] = useState<SleepEntryForm>({
      date: getYesterdayISO(),
      bedTime: '23:00',
      wakeTime: '07:00',
      latencyMin: 15,
      awakenings: 1,
      awakeMinutes: 10,
      sleepQuality: 3,
      notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['latencyMin', 'awakenings', 'awakeMinutes'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumeric ? parseInt(value, 10) || 0 : value }));
  };
  
  const handleQualityChange = (value: number) => {
      setFormData(prev => ({ ...prev, sleepQuality: value as SleepEntry['sleepQuality'] }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onAddEntry(formData);
    
    // Reset form for next entry
    setFormData({
      date: getYesterdayISO(),
      bedTime: '23:00',
      wakeTime: '07:00',
      latencyMin: 15,
      awakenings: 1,
      awakeMinutes: 10,
      sleepQuality: 3,
      notes: '',
    });
    
    setIsSubmitting(false);
  };
  
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  const chartData = useMemo(() => {
    return sortedEntries.slice(-14).map(entry => ({
        date: formatDate(entry.date, t('locale')),
        Efficiency: entry.sleepEfficiencyPct,
        Quality: entry.sleepQuality,
    }));
  }, [sortedEntries, t]);

  const CustomDot: React.FC<any> = (props) => {
    const { cx, cy, payload } = props;
    if (payload.Efficiency < 80) {
      return <Dot cx={cx} cy={cy} r={5} fill="hsl(var(--warning))" />;
    }
     if (payload.Efficiency >= 85) {
      return <Dot cx={cx} cy={cy} r={5} fill="hsl(var(--success))" />;
    }
    return <Dot cx={cx} cy={cy} r={5} fill="hsl(var(--primary))" />;
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="text-primary" />
            {t('sleep.title')}
          </CardTitle>
          <CardDescription>{t('sleep.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                 <div>
                    <Label htmlFor="date">{t('date_label')}</Label>
                    <Input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} max={todayISO()} required />
                  </div>
                 <div>
                    <Label htmlFor="bedTime">{t('sleep.bedTime')}</Label>
                    <Input type="time" id="bedTime" name="bedTime" value={formData.bedTime} onChange={handleInputChange} required />
                  </div>
                <div>
                    <Label htmlFor="wakeTime">{t('sleep.wakeTime')}</Label>
                    <Input type="time" id="wakeTime" name="wakeTime" value={formData.wakeTime} onChange={handleInputChange} required />
                  </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                 <div>
                    <Label htmlFor="latencyMin">{t('sleep.latencyMin')}</Label>
                    <Input type="number" id="latencyMin" name="latencyMin" value={formData.latencyMin} onChange={handleInputChange} min="0" required />
                  </div>
                 <div>
                    <Label htmlFor="awakenings">{t('sleep.awakenings')}</Label>
                    <Input type="number" id="awakenings" name="awakenings" value={formData.awakenings} onChange={handleInputChange} min="0" required />
                  </div>
                 <div>
                    <Label htmlFor="awakeMinutes">{t('sleep.awakeMinutes')}</Label>
                    <Input type="number" id="awakeMinutes" name="awakeMinutes" value={formData.awakeMinutes} onChange={handleInputChange} min="0" required />
                  </div>
              </div>
               <div>
                    <Label>{t('sleep.quality')}</Label>
                    <StarRating value={formData.sleepQuality} onValueChange={handleQualityChange} />
                </div>
              <div>
                    <Label htmlFor="notes">{t('notes_label')}</Label>
                    <Textarea id="notes" name="notes" placeholder={t('sleep.notes_placeholder')} value={formData.notes} onChange={handleInputChange} />
                </div>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('saving_button') : t('save_button')}</Button>
            </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart />{t('sleep.chart.title')}</CardTitle>
          <CardDescription>{t('sleep.chart.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[50, 100]} unit="%" stroke="hsl(var(--primary))" />
                <YAxis yAxisId="right" orientation="right" domain={[1, 5]} allowDecimals={false} stroke="hsl(var(--success))" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="Efficiency" name={t('sleep.efficiency')} stroke="hsl(var(--primary))" strokeWidth={2} dot={<CustomDot />} />
                <Line yAxisId="right" type="monotone" dataKey="Quality" name={t('sleep.quality')} stroke="hsl(var(--success))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground">{t('sleep.no_data_chart')}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History />{t('sleep.history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
            {sortedEntries.length > 0 ? (
                <ul className="space-y-4">
                    {sortedEntries.slice(-7).reverse().map(entry => (
                        <li key={entry.id} className="p-3 border rounded-md">
                            <p className="font-bold text-primary">{formatDate(entry.date, t('locale'))}</p>
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <span className={cn((entry.sleepEfficiencyPct ?? 0) < 80 && 'text-warning', (entry.sleepEfficiencyPct ?? 0) >= 85 && 'text-success')}>{t('sleep.efficiency')}: <span className="text-lg">{entry.sleepEfficiencyPct ?? 0}%</span></span>
                                <span className="flex items-center">{t('sleep.quality')}: <Star className={cn("ml-1 h-5 w-5", entry.sleepQuality >= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} /> {entry.sleepQuality}/5</span>
                            </div>
                            {entry.notes && <p className="text-sm mt-2 italic">"{entry.notes}"</p>}
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-muted-foreground">{t('sleep.history.none')}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default SleepDiary;
