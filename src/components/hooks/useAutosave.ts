import { useEffect, useRef, useState } from "react";

interface UseAutosaveOptions {
  delay: number; // Debounce delay in milliseconds
  onSave: (value: string) => Promise<void>; // Save function
}

interface UseAutosaveReturn {
  isSaving: boolean;
  justSaved: boolean;
  error: string | null;
  save: () => Promise<void>;
}

/**
 * Hook for automatic saving with debounce
 *
 * @param value - The value to be saved
 * @param options - Configuration options (delay, onSave callback)
 * @returns Object with save state (isSaving, justSaved, error, manual save function)
 */
export function useAutosave(value: string, options: UseAutosaveOptions): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef(value);
  const justSavedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const save = async () => {
    if (value === previousValueRef.current) {
      return; // No changes to save
    }

    setIsSaving(true);
    setError(null);

    try {
      await options.onSave(value);
      previousValueRef.current = value;

      // Show "just saved" indicator for 2 seconds
      setJustSaved(true);
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
      justSavedTimeoutRef.current = setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't auto-save if value hasn't changed
    if (value === previousValueRef.current) {
      return;
    }

    // Set up new debounced save
    timeoutRef.current = setTimeout(() => {
      save();
    }, options.delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    justSaved,
    error,
    save,
  };
}
