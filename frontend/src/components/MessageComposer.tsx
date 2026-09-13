'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Mic, Sparkles, MicOff, X, FileCheck, CornerDownLeft } from 'lucide-react';

interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

interface MessageComposerProps {
  onSendMessage: (text: string, attachment?: AttachedFile) => void;
  disabled?: boolean;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResultItem[];
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart?: () => void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onerror?: () => void;
  onend?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !attachedFile) || disabled) return;
    
    let submissionText = text.trim();
    if (attachedFile && !submissionText) {
      submissionText = `[Uploaded document: ${attachedFile.name}]`;
    }
    
    onSendMessage(submissionText, attachedFile || undefined);
    setText('');
    setAttachedFile(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeFormatted = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      
      setAttachedFile({
        name: file.name,
        size: sizeFormatted,
        type: file.type || 'document',
      });
    }
    // reset input value so re-uploading same file triggers change
    if (e.target) e.target.value = '';
  };

  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const windowWithSpeech = typeof window !== 'undefined'
      ? (window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        })
      : null;

    const SpeechRecognitionAPI =
      windowWithSpeech?.SpeechRecognition || windowWithSpeech?.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // Fallback to simulation if browser policy blocks mic
      }
    }

    // Graceful demo simulation fallback
    setIsListening(true);
    setTimeout(() => {
      setText('Where can I download my provisional fee payment slip?');
      setIsListening(false);
    }, 1600);
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
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
      />

      {/* Floating Gemini-Style Pill Container */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] focus-within:border-[var(--accent)] rounded-3xl p-2.5 sm:p-3 shadow-lg transition-all"
      >
        {/* Attachment Preview Chip */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] w-fit animate-in fade-in slide-in-from-bottom-2 duration-150">
            <FileCheck className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{attachedFile.name}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono">({attachedFile.size})</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 text-[var(--text-tertiary)] hover:text-red-400 rounded-full hover:bg-[var(--surface-1)] transition-colors ml-1 cursor-pointer"
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              title="Attach document (e.g. payment receipt, fee challan, photo)"
              aria-label="Attach document"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500/15 text-red-400 ring-2 ring-red-400/30 animate-pulse'
                  : 'hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] pl-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Grounded in 2026 handbook</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Keyboard shortcut guide */}
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] hidden md:inline-flex items-center gap-1">
              <span>Return</span>
              <CornerDownLeft className="w-2.5 h-2.5" />
              <span>to send</span>
            </span>

            {text.length > 0 && (
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] hidden sm:inline">
                {text.length} chars
              </span>
            )}

            {/* Circular FAB Send Button */}
            <button
              type="submit"
              disabled={(!text.trim() && !attachedFile) || disabled || isListening}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                (text.trim() || attachedFile) && !disabled && !isListening
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] shadow-md cursor-pointer scale-100 ring-2 ring-[var(--accent)]/30'
                  : 'bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed scale-95 opacity-60'
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
