'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string | null;
  variant?: ToastVariant;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  onClose,
}) => {
  if (!message) return null;

  const renderIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-8 right-8 z-50 bg-[var(--surface-1)] border border-[var(--accent)] text-[var(--foreground)] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none"
    >
      {renderIcon()}
      <span className="text-xs font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--foreground)] ml-1 cursor-pointer transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
