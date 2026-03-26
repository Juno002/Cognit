"use client";

import { useEffect, useRef, useCallback } from 'react';
import { UseFormReturn, FieldValues, Path, DefaultValues } from 'react-hook-form';

interface UseFormPersistenceOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  namespace: string;
  onRecover?: (data: T) => void;
  exclude?: Path<T>[];
  enabled?: boolean;
}

/**
 * Custom hook to persist react-hook-form state to sessionStorage.
 * This ensures that if the app reloads or the process is killed, 
 * the user can resume their work.
 */
export function useFormPersistence<T extends FieldValues>({
  form,
  namespace,
  onRecover,
  exclude = [],
  enabled = true,
}: UseFormPersistenceOptions<T>) {
  const STORAGE_KEY = `form_draft_${namespace}`;
  const isRecovering = useRef(false);

  // Save changes to storage
  const saveToStorage = useCallback((values: T) => {
    if (isRecovering.current || !enabled) return;
    
    // Filter out excluded fields if necessary
    const dataToSave = { ...values };
    exclude.forEach(field => {
      delete dataToSave[field];
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Failed to save form draft to localStorage:", e);
    }
  }, [STORAGE_KEY, exclude, enabled]);

  // Load from storage
  useEffect(() => {
    if (!enabled) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as T;
        isRecovering.current = true;
        
        // Reset form with saved values, merging with current default values
        // We use reset(parsed) to ensure the dirty state and values are restored correctly.
        form.reset(parsed as any, { keepDefaultValues: true });
        
        if (onRecover) {
          onRecover(parsed);
        }
        
        isRecovering.current = false;
      } catch (e) {
        console.error("Failed to recover form draft:", e);
        isRecovering.current = false;
      }
    }
  }, [form, STORAGE_KEY, onRecover, enabled]);

  // Handle value changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((value) => {
      saveToStorage(value as T);
    });
    
    return () => subscription.unsubscribe();
  }, [form, saveToStorage, enabled]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  return { clearDraft };
}
