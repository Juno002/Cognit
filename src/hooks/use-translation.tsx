
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const translations: Record<string, any> = { en, es };

export type TFunction = (key: string, options?: Record<string, string | number>) => any;

export type Locale = 'es' | 'en';

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('es'); // Default to Spanish

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && translations[savedLocale]) {
        setLocaleState(savedLocale);
      } else {
        const browserLang = navigator.language.split('-')[0] as Locale;
        setLocaleState(translations[browserLang] ? browserLang : 'es');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
    }
  };

  const t: TFunction = useCallback((key, options) => {
    const lang = translations[locale] || translations['es'];
    let text = key.split('.').reduce((obj, k) => obj && obj[k], lang);

    if (!text && locale !== 'es') {
      // Fallback to Spanish
      const fallbackLang = translations['es'];
      text = key.split('.').reduce((obj, k) => obj && obj[k], fallbackLang);
    }
    
    if (typeof text === 'string' && options) {
      Object.keys(options).forEach(k => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(options[k]));
      });
    }

    return text || key;
  }, [locale]);

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
