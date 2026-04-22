
// src/components/OnboardingTour.tsx
import React, { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { X, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { Tour } from '@/types';

interface OnboardingTourProps {
  activeTour?: Tour | null;
  visible?: boolean;
  onComplete?: (tourId: string) => Promise<void> | void;
  onSkip?: (tourId: string) => Promise<void> | void;
  onClose?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  activeTour = null,
  visible = false,
  onComplete,
  onSkip,
  onClose,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(visible && !!activeTour);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setOpen(visible && !!activeTour);
    setIndex(0);
  }, [activeTour, visible]);

  const currentStep = useMemo(() => {
    if (!activeTour || !activeTour.steps) return null;
    return activeTour.steps[index] ?? null;
  }, [activeTour, index]);

  const targetEl = useMemo(() => {
    if (typeof window === 'undefined' || !currentStep?.targetSelector) return null;
    try {
      const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
      return el;
    } catch {
      return null;
    }
  }, [currentStep]);


  const next = () => {
    if (!activeTour) return;
    if (index + 1 >= activeTour.steps.length) {
      complete();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  
  const complete = async () => {
    setOpen(false);
    if (!activeTour) return;
    await onComplete?.(activeTour.id);
    onClose?.();
  };

  const skip = async () => {
    setOpen(false);
    if (!activeTour) return;
    await onSkip?.(activeTour.id);
    onClose?.();
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") skip();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, activeTour]);
  
  useEffect(() => {
      if (targetEl) {
        targetEl.style.zIndex = '101';
        targetEl.style.boxShadow = '0 0 0 4px hsl(var(--primary))';
        targetEl.style.borderRadius = 'var(--radius)';
        targetEl.style.transition = 'box-shadow 0.3s ease-in-out';
      }
      return () => {
          if (targetEl) {
            targetEl.style.zIndex = '';
            targetEl.style.boxShadow = '';
          }
      };
  }, [targetEl]);

  if (!open || !activeTour || !currentStep) return null;

  const isCentered = !targetEl || currentStep.placement === 'center';
  
  const content = (
    <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 id={`tour-title-${currentStep.id}`} className="font-semibold text-lg">{currentStep.title}</h4>
            <p id={`tour-body-${currentStep.id}`} className="mt-1 text-sm text-muted-foreground">{currentStep.body}</p>
          </div>
          <button
            aria-label={t('close_button_aria')}
            className="p-1 rounded hover:bg-muted"
            onClick={skip}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {index + 1}/{activeTour.steps.length}
            </span>

            <div className="flex items-center gap-2">
              {currentStep.skippable !== false && (
                <button
                  className="text-sm text-muted-foreground underline"
                  onClick={skip}
                >
                  {t('skip_tour_button')}
                </button>
              )}
              {index > 0 && <button className="p-2 rounded-md hover:bg-muted" onClick={prev} aria-label={t('previous_button')}><ArrowLeft size={16} /></button>}
              <button
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
                onClick={next}
              >
                {currentStep.actionLabel ?? (index === activeTour.steps.length - 1 ? t('finish_button') : t('next_button'))}
              </button>
            </div>
        </div>
    </div>
  );

  if (isCentered) {
    return (
      <div
        aria-modal="true"
        role="dialog"
        aria-labelledby={`tour-title-${currentStep.id}`}
        aria-describedby={`tour-body-${currentStep.id}`}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={skip} />
        <div
          className="z-[101] max-w-md w-full bg-card rounded-xl shadow-2xl p-5"
          role="document"
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <Popover.Root open={true}>
      <Popover.Anchor asChild>
        <div style={{
            position: 'absolute',
            top: targetEl.getBoundingClientRect().top + window.scrollY,
            left: targetEl.getBoundingClientRect().left + window.scrollX,
            width: targetEl.getBoundingClientRect().width,
            height: targetEl.getBoundingClientRect().height,
        }}/>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side={currentStep.placement === 'center' ? 'top' : currentStep.placement}
          sideOffset={10}
          align="center"
          className="z-[102] w-72 rounded-lg bg-card p-4 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`tour-title-${currentStep.id}`}
          aria-describedby={`tour-body-${currentStep.id}`}
        >
         {content}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
