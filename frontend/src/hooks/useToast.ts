'use client';

import { useState, useCallback, useRef } from 'react';
import { ToastVariant } from '@/components/ui/Toast';

export function useToast(defaultDuration: number = 3000) {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success', duration: number = defaultDuration) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({ message, variant });
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    },
    [defaultDuration]
  );

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(null);
  }, []);

  return {
    toastMessage: toast?.message ?? null,
    toastVariant: toast?.variant ?? 'success',
    showToast,
    hideToast,
  };
}
