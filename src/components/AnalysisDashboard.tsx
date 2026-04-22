
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as BarChartIcon, Brain, PieChart as PieChartIcon, Target, TrendingUp, Zap, LineChart as LineChartIcon, Search, Sparkles } from 'lucide-react';
import { BarChart, PieChart, LineChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import type { JournalStats, JournalAnalysis } from '@/hooks/use-cbt-journal';
import { MIN_SESSIONS_FOR_ANALYSIS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ThoughtEntry, ClinicalProfile } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Progress } from '@/components/ui/progress';
import { getReflejoState } from '@/lib/reflejo';
import ReflejoAvatar from '@/components/ReflejoAvatar';
import { SafeRichText } from '@/components/SafeRichText';

interface AnalysisDashboardProps {
  analysis: JournalAnalysis;
  stats: JournalStats;
  entries: ThoughtEntry[];
  clinicalProfile?: ClinicalProfile;
}

const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
        {label && <p className="font-bold mb-1">{label}</p>}
        <p style={{ color: data.fill || data.stroke }}>
            {data.name}: <span className="font-bold">{data.value}</span>
        </p>
        {payload[0].payload.emotion && <p>{t('emotion_label')}: {payload[0].payload.emotion}</p>}
      </div>
    );
  }
  return null;
};


const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, stats, entries, clinicalProfile }) => {
  const { t } = useTranslation();
  entries = entries || []; // Ensure entries is always an array
  const [comparisonDays, setComparisonDays] = useState('7');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[] | null>(null);

  const EMOTIONS: {emoji: string, label: string, color?: string}[] = useMemo(() => t('emotions'), [t]);
  
  const emotionColorMap = useMemo(() => EMOTIONS.reduce((acc, e) => {
    acc[e.label] = e.color || 'hsl(var(--primary))';
    return acc;
  }, {} as Record<string, string>), [EMOTIONS]);


  const levelData = [
    { name: 'L1', value: stats.levelCount[1] || 0, fill: 'hsl(var(--primary))' },
    { name: 'L2', value: stats.levelCount[2] || 0, fill: 'hsl(var(--icc-metric))' },
    { name: 'L3', value: stats.levelCount[3] || 0, fill: 'hsl(var(--warning))' },
  ];

  const emotionData = Object.entries(stats.emotionFreq).map(([name, value]) => ({
    name,
    value,
  }));
  
  const recentEntries = entries.slice(0, 7).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const timelineData = recentEntries.map(e => ({
      date: e.date.slice(5).replace('-', '/'),
      intensity: e.intensity,
      emotion: e.emotion,
  }));
  
  const goalProgress = stats.totalGoals > 0 ? (stats.completedGoals / stats.totalGoals) * 100 : 0;

  const handleCompare = () => {
    const result = analysis.compareLastDays(parseInt(comparisonDays));
    setComparisonResult(result);
  };
  
  const handleDetectPatterns = () => {
      const detected = analysis.detectPatterns();
      setPatterns(detected);
  }
  
  const getPatternClass = (type: string) => {
    switch (type) {
        case 'success': return 'border-l-success bg-success/10';
        case 'warning': return 'border-l-warning bg-warning/10';
        default: return 'border-l-primary bg-primary/10';
    }
  }

  const pleasureMasteryData = [
    { subject: t('activation_pleasure_label_short'), value: analysis.pleasureMasteryBalance.avgPleasure, fullMark: 10 },
    { subject: t('activation_mastery_label_short'), value: analysis.pleasureMasteryBalance.avgMastery, fullMark: 10 },
  ];

  const reflejo = getReflejoState(stats, analysis, t, { clinicalProfile });

  return (
    <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
                <ReflejoAvatar mode={reflejo.mode} size={60} />
            </div>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    {reflejo.mode === 'mentor' ? 'Lambda (Mentor)' : 'Lambda'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pr-20">
                <p className="font-medium text-lg text-primary/80 italic">"{reflejo.message}"</p>
                {stats.avgICC && (
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-sm font-semibold">{t('avg_icc_label')}:</span>
                        <span className="font-bold text-xl text-icc-metric">{stats.avgICC}</span>
                    </div>
                )}
                {analysis.insight && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{analysis.insight}</p>
                )}
            </CardContent>
        </Card>

      {/* Goal Progress */}
      {stats.totalGoals > 0 && (
         <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target />{t('analysis_goals_title')}</CardTitle>
              <CardDescription>{t('analysis_goals_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t('analysis_goals_completed')}</span>
                  <span className="font-bold">{stats.completedGoals} / {stats.totalGoals}</span>
              </div>
              <Progress value={goalProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Pleasure/Mastery Balance */}
      {analysis.pleasureMasteryBalance.totalActivities > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap/>{t('pleasure_mastery_balance_title')}</CardTitle>
                  <CardDescription>{t('pleasure_mastery_balance_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pleasureMasteryData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} />
                          <Radar name="Balance" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                          <Tooltip />
                      </RadarChart>
                  </ResponsiveContainer>
                  {analysis.pleasureMasteryBalance.insight && (
                      <div className="mt-4 rounded-lg border border-primary bg-primary/10 p-3 text-sm">
                          <p>{analysis.pleasureMasteryBalance.insight}</p>
                      </div>
                  )}
              </CardContent>
          </Card>
      )}


       {/* Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp />{t('temporal_comparison_title')}</CardTitle>
          <CardDescription>{t('temporal_comparison_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={comparisonDays} onValueChange={setComparisonDays}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_days_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('last_7_days')}</SelectItem>
                <SelectItem value="14">{t('last_14_days')}</SelectItem>
                <SelectItem value="30">{t('last_30_days')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCompare}>{t('compare_button')}</Button>
          </div>
          {comparisonResult && (
             <div className={cn(
                "mt-4 rounded-lg border p-4 text-sm",
                comparisonResult.error ? "border-destructive bg-destructive/10 text-destructive" : "border-primary bg-primary/10"
             )}>
                {comparisonResult.error ? (
                    <p>{comparisonResult.error}</p>
                ) : (
                    <>
                        <p className="font-bold mb-2">{comparisonResult.insight}</p>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-xs text-muted-foreground">{t('older_avg_label')}</p>
                                <p className="text-lg font-bold">{comparisonResult.older.avgIntensity}</p>
                            </div>
                             <div>
                                <p className="text-xs text-muted-foreground">{t('recent_avg_label')}</p>
                                <p className="text-lg font-bold">{comparisonResult.recent.avgIntensity}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain />{t('pattern_analysis_title')}</CardTitle>
            <CardDescription>{t('pattern_analysis_desc', { min: MIN_SESSIONS_FOR_ANALYSIS, current: stats.total })}</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleDetectPatterns} className="w-full mb-4" disabled={stats.total < MIN_SESSIONS_FOR_ANALYSIS}>{t('analyze_patterns_button')}</Button>
             {patterns && (
                <ul className="space-y-2">
                  {patterns.length > 0 ? patterns.map((p, i) => (
                    <li key={i} className={cn("border-l-4 p-3 rounded-r-md text-sm", getPatternClass(p.type))}>
                        <SafeRichText text={p.text} />
                    </li>
                  )) : (
                      <li className="border-l-4 border-gray-400 bg-gray-400/10 p-3 rounded-r-md text-sm">{t('no_patterns_detected')}</li>
                  )}
                </ul>
            )}
        </CardContent>
      </Card>
      
       {/* ICC per emotion */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target/>{t('icc_by_emotion_title')}</CardTitle>
              <CardDescription>{t('icc_by_emotion_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
              {analysis.iccFeedback && (
                  <SafeRichText
                    text={analysis.iccFeedback}
                    className="mb-4 rounded-lg border border-primary bg-primary/10 p-3 text-sm"
                  />
              )}
              {analysis.iccByEmotion.length > 0 ? (
                  <div className="space-y-2 text-sm">
                      {analysis.iccByEmotion.map(item => {
                           const iccValue = parseFloat(item.avgICC);
                           let colorClass = '';
                           if (iccValue > 0.65) colorClass = 'text-success';
                           else if (iccValue > 0.3) colorClass = 'text-warning';
                           else colorClass = 'text-destructive';
                           return (
                               <div key={item.emotion} className="flex justify-between items-center">
                                  <span>{item.emotion}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={cn("font-bold", colorClass)}>{item.avgICC}</span>
                                    <span className="text-xs text-muted-foreground">({item.count} L3)</span>
                                  </div>
                                </div>
                           )
                      })}
                  </div>
              ) : (
                  <p className="text-center text-sm text-muted-foreground">{t('icc_by_emotion_insufficient_data')}</p>
              )}
          </CardContent>
      </Card>

      {/* Distortion Analysis */}
       <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search />{t('frequent_distortions_title')}</CardTitle>
              <CardDescription>{t('frequent_distortions_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
              {analysis.distortionFreq.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                      {analysis.distortionFreq.map(d => (
                          <li key={d.name} className="flex justify-between items-center">
                              <span className="font-medium">{d.name}</span>
                              <span className="text-muted-foreground">{t('times_count', {count: d.count})}</span>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-center text-sm text-muted-foreground">
                      {t('frequent_distortions_insufficient_data')}
                  </p>
              )}
          </CardContent>
      </Card>
      
       {/* Main Triggers */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap />{t('main_triggers_title')}</CardTitle>
              <CardDescription>{t('main_triggers_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
              {analysis.triggers.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                      {analysis.triggers.map((t, i) => {
                          let colorClass = '';
                           if (t.avgIntensity >= 7) colorClass = 'text-destructive';
                           else if (t.avgIntensity >= 5) colorClass = 'text-warning';
                           else colorClass = 'text-success';
                          return (
                          <li key={i} className="flex justify-between items-center capitalize">
                              <span>{t.situation}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn("font-bold", colorClass)}>{t.avgIntensity}/10</span>
                                <span className="text-xs text-muted-foreground">({t.count})</span>
                              </div>
                          </li>
                      )})}
                  </ul>
              ) : (
                   <p className="text-center text-sm text-muted-foreground">{t('main_triggers_insufficient_data')}</p>
              )}
          </CardContent>
      </Card>

      {/* Círculo Virtuoso Correlation */}
      <Card className="border-primary/30 shadow-md">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-secondary" />{t('analysis_virtuous_circle_title')}</CardTitle>
              <CardDescription>{t('analysis_virtuous_circle_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analysis.virtuousCircle}>
                          <defs>
                              <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--icc-metric))" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="hsl(var(--icc-metric))" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                          <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" domain={[0, 10]} hide />
                          <YAxis yAxisId="right" orientation="right" hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                          <Area 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="sleep" 
                            name={t('analysis_virtuous_circle_sleep_label')} 
                            stroke="hsl(var(--icc-metric))" 
                            fillOpacity={1} 
                            fill="url(#colorSleep)" 
                            strokeWidth={1}
                          />
                          <Bar 
                            yAxisId="right"
                            dataKey="activity" 
                            name={t('analysis_virtuous_circle_activity_label')} 
                            fill="hsl(var(--secondary))" 
                            radius={[2, 2, 0, 0]} 
                            barSize={20}
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="mood" 
                            name={t('analysis_virtuous_circle_mood_label')} 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            dot={{ fill: 'hsl(var(--primary))' }}
                            activeDot={{ r: 6 }} 
                          />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
      </Card>

      {/* Charts */}
       <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChartIcon />{t('depth_title')}</CardTitle>
                <CardDescription>{t('level_distribution_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={levelData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: 'hsla(var(--muted), 0.3)' }}/>
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={500} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon/>{t('emotions_title')}</CardTitle>
                <CardDescription>{t('emotion_frequency_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={emotionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label isAnimationActive={true} animationDuration={500}>
                            {emotionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={emotionColorMap[entry.name] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip t={t} />} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChartIcon />{t('timeline_title')}</CardTitle>
            <CardDescription>{t('timeline_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Legend />
                    <Line type="monotone" dataKey="intensity" name={t('intensity_label')} stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} isAnimationActive={true} animationDuration={500} />
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisDashboard;
