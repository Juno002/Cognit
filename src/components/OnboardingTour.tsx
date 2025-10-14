
"use client";

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useCbtJournal } from '@/hooks/use-cbt-journal';
import { useTranslation } from '@/hooks/use-translation';

export const OnboardingTour = () => {
  const { showTour, completeTour } = useCbtJournal();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const tourSteps = [
    {
      selector: '[data-tour="level-select"]',
      title: t('tour_step1_title'),
      content: t('tour_step1_content'),
      side: 'bottom' as const,
    },
    {
      selector: '[data-tour="analysis-tab"]',
      title: t('tour_step2_title'),
      content: t('tour_step2_content'),
      side: 'bottom' as const,
    },
    {
      selector: '[data-tour="autozip-button"]',
      title: t('tour_step3_title'),
      content: t('tour_step3_content'),
      side: 'bottom' as const,
    },
  ];

  useEffect(() => {
    if (showTour) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
    }
  }, [showTour]);
  
  useEffect(() => {
    if (!showTour) return;

    const element = document.querySelector(tourSteps[currentStep].selector) as HTMLElement;
    
    if (element) {
        setTargetElement(element);
        element.style.zIndex = '100';
        element.style.boxShadow = '0 0 0 4px hsl(var(--primary))';
        element.style.borderRadius = 'var(--radius)';
        element.style.transition = 'box-shadow 0.3s ease-in-out';
    } else {
        setTargetElement(null); // Element not found
    }

    // Cleanup function
    return () => {
      if (element) {
        element.style.zIndex = '';
        element.style.boxShadow = '';
        element.style.borderRadius = '';
        element.style.transition = '';
      }
    };
  }, [showTour, currentStep, tourSteps]);

  const goToStep = (stepIndex: number) => {
    const currentElement = document.querySelector(tourSteps[currentStep].selector) as HTMLElement;
    if (currentElement) {
        currentElement.style.zIndex = '';
        currentElement.style.boxShadow = '';
    }
    setCurrentStep(stepIndex);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };
  
  const handleFinish = () => {
    if(targetElement) {
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
    }
    setPopoverOpen(false);
    completeTour();
  };

  if (!showTour || !targetElement) {
    return null;
  }

  const { title, content, side } = tourSteps[currentStep];

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
       <PopoverTrigger asChild>
        <div 
          style={{ 
            position: 'absolute', 
            top: targetElement.getBoundingClientRect().top + window.scrollY, 
            left: targetElement.getBoundingClientRect().left + window.scrollX,
            width: targetElement.getBoundingClientRect().width,
            height: targetElement.getBoundingClientRect().height,
          }}
        />
      </PopoverTrigger>
        <PopoverContent
          side={side}
          align="center"
          className="w-80 z-[99] relative"
          sideOffset={10}
        >
        <button
          onClick={handleFinish}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-4">
          <h4 className="font-bold text-lg">{title}</h4>
          <p className="text-sm text-muted-foreground">{content}</p>
          <div className="flex justify-between items-center">
             <div className="text-sm">
                {currentStep + 1} / {tourSteps.length}
             </div>
             <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={handlePrev}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> {t('previous_button')}
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tourSteps.length - 1 ? t('finish_button') : t('next_button')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
             </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};