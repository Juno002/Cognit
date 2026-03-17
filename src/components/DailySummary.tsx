import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { JournalStats } from '@/hooks/use-cbt-journal';
import { useTranslation } from '@/hooks/use-translation';

interface DailySummaryProps {
  stats: JournalStats;
}

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


const DailySummary: React.FC<DailySummaryProps> = ({ stats }) => {
  const { t } = useTranslation();
  const levelText = stats.predominantLevel === '1' ? '💙 L1' : stats.predominantLevel === '2' ? '💜 L2' : stats.predominantLevel === '3' ? '💛 L3' : '-';
  
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('sessions_stat_title')} value={stats.total} />
        <StatCard title={t('streak_stat_title')} value={`${stats.streak}d`} />
        <StatCard title={t('level_stat_title')} value={levelText} />
        <StatCard title={t('emotion_stat_title')} value={stats.topEmotion || '-'} />
    </div>
  );
};

export default DailySummary;
