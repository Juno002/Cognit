
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import type { Goal } from "../../types";
import { useCbtJournal } from "@/hooks/use-cbt-journal";
import { useToast } from "@/hooks/use-toast";

interface GoalFormProps {
  onSave: (goal: Partial<Goal>) => void;
  onClose: () => void;
  initialData?: Partial<Goal>;
}

export function GoalForm({ onSave, onClose, initialData }: GoalFormProps) {
  const { t } = useCbtJournal();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Goal>>({
    title: "",
    description: "",
    measurement: "",
    difficulty: 5,
    relevance: "",
    targetDate: new Date().toISOString().split("T")[0],
    progress: 0,
    priority: "medium",
  });

  useEffect(() => {
    // If there is initial data (editing), set the form data. Otherwise, reset to default for creation.
    if (initialData) {
        setFormData({
            title: initialData.title || "",
            description: initialData.description || "",
            measurement: initialData.measurement || "",
            difficulty: initialData.difficulty || 5,
            relevance: initialData.relevance || "",
            targetDate: initialData.targetDate || new Date().toISOString().split("T")[0],
            progress: initialData.progress || 0,
            priority: initialData.priority || "medium",
            createdAt: initialData.createdAt || new Date().toISOString(),
        });
    } else {
        setFormData({
            title: "",
            description: "",
            measurement: "",
            difficulty: 5,
            relevance: "",
            targetDate: new Date().toISOString().split("T")[0],
            progress: 0,
            priority: "medium",
            createdAt: new Date().toISOString(),
        });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.measurement || !formData.targetDate) {
      toast({
        title: t('validation_error_title'),
        description: t('goals.validation_error_desc'),
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>S ({t('goals.specific')}) - {t('goals.title_label')}</Label>
        <Input
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t('goals.title_placeholder')}
          required
        />
      </div>
      <div>
        <Label>{t('goals.description_label')}</Label>
        <Input
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('goals.description_placeholder')}
        />
      </div>
      <div>
        <Label>M ({t('goals.measurable')}) - {t('goals.measurement')}</Label>
        <Input
          value={formData.measurement || ""}
          onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
          placeholder={t('goals.measurement_placeholder')}
          required
        />
      </div>
      <div>
        <Label>A ({t('goals.achievable')}) - {t('goals.difficulty')} (1-10)</Label>
        <Slider
          value={[formData.difficulty || 5]}
          onValueChange={(value) => setFormData({ ...formData, difficulty: value[0] })}
          max={10}
          min={1}
          step={1}
        />
        <p className="text-sm text-gray-600">{t('goals.difficulty')}: {formData.difficulty || 5}/10</p>
      </div>
      <div>
        <Label>R ({t('goals.relevant')}) - {t('goals.relevance_label')}</Label>
        <Input
          value={formData.relevance || ""}
          onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
          placeholder={t('goals.relevance_placeholder')}
        />
      </div>
      <div>
        <Label>T ({t('goals.time_bound')}) - {t('goals.target_date_label')}</Label>
        <Input
          type="date"
          value={formData.targetDate || ""}
          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
          min={new Date(formData.createdAt || Date.now()).toISOString().split("T")[0]}
          required
        />
      </div>
      <div>
          <Label>{t('goals.priority')}</Label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" })}
            className="w-full p-2 border rounded bg-background text-foreground"
          >
            <option value="low">{t('goals.priority_low')}</option>
            <option value="medium">{t('goals.priority_medium')}</option>
            <option value="high">{t('goals.priority_high')}</option>
          </select>
        </div>
      {initialData && (
        <div>
          <Label>{t('goals.progress_label')}</Label>
          <Slider
            value={[formData.progress || 0]}
            onValueChange={(value) => setFormData({ ...formData, progress: value[0] })}
            max={100}
            min={0}
            step={1}
          />
          <p className="text-sm text-gray-600">{t('goals.progress')}: {formData.progress || 0}%</p>
        </div>
      )}
      <Button type="submit" className="w-full">
        {initialData ? t('goals.update_button') : t('goals.save_button')}
      </Button>
    </form>
  );
}
