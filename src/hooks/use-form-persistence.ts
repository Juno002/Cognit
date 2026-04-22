"use client";

import { useEffect, useRef, useCallback } from 'react';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';

interface UseFormPersistenceOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  namespace: string;
  onRecover?: (data: T) => void;
  exclude?: Path<T>[];
  enabled?: boolean;
  debounceMs?: number;
  loadDraft?: () => T | null | undefined | Promise<T | null | undefined>;
  saveDraft?: (data: T) => void | Promise<void>;
  clearDraft?: () => void | Promise<void>;
}

/**
 * Persists react-hook-form state through an explicit storage adapter.
 *
 * Sensitive Cognit drafts must live in the encrypted vault. This hook
 * intentionally has no localStorage/sessionStorage fallback.
 */
export function useFormPersistence<T extends FieldValues>({
  form,
  namespace,
  onRecover,
  exclude = [],
  enabled = true,
  debounceMs = 600,
  loadDraft,
  saveDraft,
  clearDraft: clearDraftAdapter,
}: UseFormPersistenceOptions<T>) {
  const isRecovering = useRef(false);
  const hasRecovered = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save changes to storage
  const saveToStorage = useCallback((values: T) => {
    if (isRecovering.current || !enabled || !saveDraft) return;
    
    // Filter out excluded fields if necessary
    const dataToSave = { ...values };
    exclude.forEach(field => {
      delete dataToSave[field];
    });

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      void Promise.resolve(saveDraft(dataToSave as T)).catch((error) => {
        console.warn(`Failed to save ${namespace} form draft:`, error);
      });
    }, debounceMs);
  }, [debounceMs, exclude, enabled, namespace, saveDraft]);

  // Load from storage
  useEffect(() => {
    if (!enabled || !loadDraft || hasRecovered.current) return;

    let cancelled = false;

    void Promise.resolve(loadDraft()).then((saved) => {
      hasRecovered.current = true;
      if (!saved || cancelled) return;
      try {
        isRecovering.current = true;
        
        // Reset form with saved values, merging with current default values
        // We use reset(parsed) to ensure the dirty state and values are restored correctly.
        form.reset(saved as any, { keepDefaultValues: true });
        
        if (onRecover) {
          onRecover(saved);
        }
        
        isRecovering.current = false;
      } catch (e) {
        console.error("Failed to recover form draft:", e);
        isRecovering.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [form, loadDraft, onRecover, enabled]);

  // Handle value changes
  useEffect(() => {
    if (!enabled || !saveDraft) return;

    const subscription = form.watch((value) => {
      saveToStorage(value as T);
    });
    
    return () => {
      subscription.unsubscribe();
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [form, saveDraft, saveToStorage, enabled]);

  const clearDraft = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    if (!clearDraftAdapter) return;

    void Promise.resolve(clearDraftAdapter()).catch((error) => {
      console.warn(`Failed to clear ${namespace} form draft:`, error);
    });
  }, [clearDraftAdapter, namespace]);

  return { clearDraft };
}
