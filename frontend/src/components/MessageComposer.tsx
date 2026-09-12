'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Mic, Sparkles, MicOff } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => {
        setText('Where can I download my provisional fee payment slip?');
        setIsListening(false);
      }, 1800);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [text]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 pt-1 transition-all">
      {/* Floating Gemini-Style Pill Container */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] focus-within:border-[var(--accent)] rounded-3xl p-2.5 sm:p-3 shadow-lg transition-all"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening to student question...'
              : 'Ask CampusOne anything across university departments...'
          }
          rows={1}
          disabled={disabled || isListening}
          className="w-full bg-transparent text-[var(--foreground)] placeholder-[var(--text-tertiary)] text-[15px] sm:text-base resize-none focus:outline-hidden px-3.5 py-1.5 min-h-[38px] max-h-36 overflow-y-auto leading-relaxed"
        />

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-1.5 px-1 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              title="Add attachment (e.g. payment receipt or fee challan)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isListening
                  ? 'bg-red-500/10 text-red-500 animate-pulse'
                  : 'hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] pl-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Grounded in 2026 handbook</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {text.length > 0 && (
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] hidden sm:inline">
                {text.length} chars
              </span>
            )}

            {/* Circular FAB Send Button */}
            <button
              type="submit"
              disabled={!text.trim() || disabled || isListening}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                text.trim() && !disabled && !isListening
                  ? 'bg-[var(--accent)] text-[#131314] hover:bg-[var(--accent-hover)] shadow-md cursor-pointer scale-100 ring-2 ring-[var(--accent)]/30'
                  : 'bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed scale-95 opacity-60'
              }`}
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
