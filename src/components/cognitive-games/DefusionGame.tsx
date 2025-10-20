
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import { useTranslation } from '@/hooks/use-translation';
import { BrainCircuit, BookPlus } from 'lucide-react';

const DefusionGame = ({ onOpenJournal }: { onOpenJournal: () => void }) => {
  const { addNewEntry } = useCbtJournal();
  const { t } = useTranslation();
  const [thought, setThought] = useState('');
  const [defusedThought, setDefusedThought] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleDefusion = async () => {
    if (!thought) return;
    setIsSaving(true);
    const defused = t('defusion_prefix', { thought });
    setDefusedThought(defused);

    // Save a quick, non-intrusive entry in the background
    await addNewEntry({
      date: new Date().toISOString().split('T')[0],
      level: 2,
      emotion: t('defusion_emotion'),
      intensity: 4, // Default low intensity
      note: t('defusion_note', { thought }),
      tags: ['defusion', 'act'],
      promptUsed: 'Defusion Game',
      situation: t('defusion_situation'),
      automaticThought: thought,
      alternativeResponse: defused,
    });
    
    setIsSaving(false);
    setThought(''); // Clear input after defusing
  };
  
  const handleExpand = () => {
    // This will be handled by the parent to open the main journal form
    // The parent can pre-fill the form with data from this component if needed
    onOpenJournal(); 
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            {t('defusion_game_title')}
        </CardTitle>
        <CardDescription>{t('defusion_game_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          type="text"
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder={t('defusion_game_placeholder')}
          className="w-full p-2 border rounded mt-2"
        />
        <Button onClick={handleDefusion} disabled={!thought || isSaving} className="mt-2 w-full">
          {isSaving ? t('saving_button') : t('defusion_game_button')}
        </Button>
        {defusedThought && (
          <div className="mt-4 text-green-600 dark:text-green-400 p-3 bg-green-500/10 rounded-md animate-fade-in">
            <p><strong>{t('defusion_game_result')}:</strong> {defusedThought}</p>
             <Button variant="link" size="sm" onClick={handleExpand} className="p-0 h-auto mt-2 text-primary">
                <BookPlus className="mr-2 h-4 w-4" />
                {t('defusion_expand_button')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DefusionGame;
