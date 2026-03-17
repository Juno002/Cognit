import type { Achievement } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from '@/hooks/use-translation';

interface AchievementPillProps {
  achievement: Achievement;
}

export const AchievementPill: React.FC<AchievementPillProps> = ({ achievement }) => {
  const { t } = useTranslation();
  const unlockedDate = new Date(achievement.unlockedAt).toLocaleDateString(t('locale'), { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline"
            className="cursor-default border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 animate-fade-in"
            aria-label={`${t('achievement_aria_label')}: ${achievement.name}`}
          >
            <span className="mr-2">{achievement.emoji}</span>
            {achievement.name}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('unlocked_on', { date: unlockedDate })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
