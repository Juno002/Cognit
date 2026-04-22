import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/use-translation';
import { SafeRichText } from '@/components/SafeRichText';

interface NegativeStreakAlertProps {
  days: number;
}

export const NegativeStreakAlert: React.FC<NegativeStreakAlertProps> = ({ days }) => {
  const { t } = useTranslation();
  return (
    <Alert variant="destructive" className="animate-fade-in">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('rumination_alert_title')}</AlertTitle>
      <AlertDescription>
        <SafeRichText text={t('rumination_alert_desc', { days })} />
      </AlertDescription>
    </Alert>
  );
};
