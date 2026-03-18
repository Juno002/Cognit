
"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mic } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";


const HelpSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-lg mb-2 text-primary">{title}</h4>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
            {children}
        </div>
    </div>
);


const HelpModal = () => {
  const { t } = useTranslation();

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{t('help_title')}</DialogTitle>
        <DialogDescription>
            {t('help_description')}
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[65vh] overflow-y-auto pr-4 py-4">
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">{t('help_section1_title')}</AccordionTrigger>
            <AccordionContent>
                <HelpSection title={t('help_section1_subtitle')}>
                    <p>{t('help_section1_p1')}</p>
                    <ul>
                        <li><strong>{t('help_section1_l1_title')}</strong> {t('help_section1_l1_desc')}</li>
                        <li><strong>{t('help_section1_l2_title')}</strong> {t('help_section1_l2_desc')}</li>
                        <li><strong>{t('help_section1_l3_title')}</strong> {t('help_section1_l3_desc')}</li>
                    </ul>
                     <p className="flex items-center gap-2"><strong>{t('help_section1_voice_title')}</strong> {t('help_section1_voice_desc')} <Mic className="inline-block h-4 w-4"/></p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-lambda">
            <AccordionTrigger className="text-lg font-semibold">{t('help_lambda_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_lambda_subtitle')}>
                    <p>{t('help_lambda_desc')}</p>
                    <ul>
                        <li><strong>{t('help_lambda_l1_title')}</strong> {t('help_lambda_l1_desc')}</li>
                        <li><strong>{t('help_lambda_l2_title')}</strong> {t('help_lambda_l2_desc')}</li>
                        <li><strong>{t('help_lambda_l3_title')}</strong> {t('help_lambda_l3_desc')}</li>
                    </ul>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-clinical">
            <AccordionTrigger className="text-lg font-semibold">{t('help_clinical_focus_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_clinical_focus_subtitle')}>
                    <p>{t('help_clinical_focus_desc')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">{t('help_section2_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_section2_subtitle')}>
                    <ul>
                        <li><strong>{t('help_section2_l1_title')}</strong> {t('help_section2_l1_desc')}</li>
                        <li><strong>{t('help_section2_l2_title')}</strong> {t('help_section2_l2_desc')}</li>
                        <li><strong>{t('help_section2_l3_title')}</strong> {t('help_section2_l3_desc')}</li>
                         <li><strong>{t('help_section2_l4_title')}</strong> {t('help_section2_l4_desc')}</li>
                    </ul>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-semibold">{t('help_activation_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_activation_subtitle')}>
                    <p>{t('help_activation_desc')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>
          
           <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">{t('help_section3_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_section3_subtitle')}>
                    <p>{t('help_section3_p1')}</p>
                    <ul>
                        <li><strong>{t('help_section3_l1_title')}</strong> {t('help_section3_l1_desc')}</li>
                        <li><strong>{t('help_section3_l2_title')}</strong> {t('help_section3_l2_desc')}</li>
                        <li><strong>{t('help_section3_l3_title')}</strong> {t('help_section3_l3_desc')}</li>
                    </ul>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>
          
           <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">{t('help_section5_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_section5_subtitle')}>
                     <p>{t('help_section5_p1')}</p>
                    <ul>
                        <li><strong>{t('help_section5_l1_title')}</strong> {t('help_section5_l1_desc')}</li>
                        <li><strong>{t('help_section5_l2_title')}</strong> {t('help_section5_l2_desc')}</li>
                        <li><strong>{t('help_section5_l3_title')}</strong> {t('help_section5_l3_desc')}</li>
                        <li><strong>{t('help_section5_l4_title')}</strong> {t('help_section5_l4_desc')}</li>
                         <li><strong>{t('help_section5_l5_title')}</strong> {t('help_section5_l5_desc')}</li>
                         <li><strong>{t('help_section5_l6_title')}</strong> {t('help_section5_l6_desc')}</li>
                    </ul>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-semibold">{t('help_goals_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_goals_subtitle')}>
                    <p>{t('help_goals_desc')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="item-9">
            <AccordionTrigger className="text-lg font-semibold">{t('help_wellness_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_wellness_subtitle')}>
                    <p>{t('help_wellness_desc')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-semibold">{t('help_sleep_title')}</AccordionTrigger>
              <AccordionContent>
                  <HelpSection title={t('help_sleep_subtitle')}>
                      <p>{t('help_sleep_desc')}</p>
                      <ul>
                          <li><strong>{t('help_sleep_l1_title')}</strong> {t('help_sleep_l1_desc')}</li>
                          <li><strong>{t('help_sleep_l2_title')}</strong> {t('help_sleep_l2_desc')}</li>
                          <li><strong>{t('help_sleep_l3_title')}</strong> {t('help_sleep_l3_desc')}</li>
                      </ul>
                  </HelpSection>
              </AccordionContent>
          </AccordionItem>

           <AccordionItem value="item-10">
            <AccordionTrigger className="text-lg font-semibold">🧩 {t('help_downward_arrow_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_downward_arrow_subtitle')}>
                    <p>{t('help_downward_arrow_p1')}</p>
                    <p>{t('help_downward_arrow_p2')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11">
            <AccordionTrigger className="text-lg font-semibold">📏 {t('help_task_splitter_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_task_splitter_subtitle')}>
                    <p>{t('help_task_splitter_p1')}</p>
                    <p>{t('help_task_splitter_p2')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-12">
            <AccordionTrigger className="text-lg font-semibold">🎡 {t('help_virtuous_circle_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_virtuous_circle_subtitle')}>
                    <p>{t('help_virtuous_circle_p1')}</p>
                    <p>{t('help_virtuous_circle_p2')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">{t('help_section4_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('help_section4_subtitle')}>
                    <ul>
                        <li><strong>{t('help_section4_l1_title')}</strong> {t('help_section4_l1_desc')}</li>
                        <li><strong>{t('help_section4_l2_title')}</strong> {t('help_section4_l2_desc')}</li>
                        <li><strong>{t('help_section4_l3_title')}</strong> {t('help_section4_l3_desc')}</li>
                        <li><strong>{t('help_section4_l4_title')}</strong> {t('help_section4_l4_desc')}</li>
                         <li><strong>{t('help_section4_l5_title')}</strong> {t('help_section4_l5_desc')}</li>
                    </ul>
                     <p className="font-bold text-destructive">{t('help_section4_warning')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-13">
            <AccordionTrigger className="text-lg font-semibold text-destructive">⚖️ {t('clinical_disclaimer_title')}</AccordionTrigger>
            <AccordionContent>
                 <HelpSection title={t('clinical_disclaimer_title')}>
                    <p className="font-bold">{t('clinical_disclaimer_body')}</p>
                </HelpSection>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
       <DialogFooter>
        <DialogClose asChild>
          <Button>✅ {t('understood_button')}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export default HelpModal;
