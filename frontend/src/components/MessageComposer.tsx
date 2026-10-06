'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Paperclip, Mic, MicOff, X, FileCheck } from 'lucide-react';

interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

interface MessageComposerProps {
  onSendMessage: (text: string, attachment?: AttachedFile) => void;
  disabled?: boolean;
  onClearContext?: () => void;
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
  onClearContext,
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
    } else if (e.key === 'Escape') {
      setText('');
      setAttachedFile(null);
      onClearContext?.();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      setAttachedFile({
        name: file.name,
        size: sizeFormatted,
        type: file.type || 'document',
      });
    }
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

    const windowWithSpeech =
      typeof window !== 'undefined'
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

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // Fall through to alert
      }
    }

    // Speech recognition not supported in this browser
    alert('Voice input is not supported in this browser environment.');
    setIsListening(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  return (
    <div className="w-full max-w-[800px] mx-auto px-1 sm:px-0 transition-all select-none">
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
      />

      {/* Target Composer Container */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-[#111216]/95 border border-[#23242E] hover:border-[#2F313E] focus-within:border-[#FF7A00]/60 focus-within:shadow-[0_0_24px_rgba(255,122,0,0.12)] rounded-xl p-3.5 sm:p-4 transition-all shadow-lg"
      >
        {/* Attachment Preview Chip */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-[#16171E] border border-[#242531] text-xs text-[#F5F3ED] w-fit animate-in fade-in duration-150">
            <FileCheck className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{attachedFile.name}</span>
            <span className="text-[10px] text-[#8D8A83] font-mono">({attachedFile.size})</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-0.5 text-[#8D8A83] hover:text-[#FF7A00] rounded transition-colors ml-1 cursor-pointer"
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening to your inquiry...'
              : "What's on your mind? Just type your problem."
          }
          rows={1}
          disabled={disabled || isListening}
          className="w-full bg-transparent text-[#F5F3ED] placeholder:text-[#6A6965] text-sm sm:text-[15px] resize-none focus:outline-none px-1 py-1 min-h-[44px] sm:min-h-[50px] max-h-36 overflow-y-auto leading-relaxed font-sans"
        />

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#1F2027] mt-2">
          {/* Left Controls: Attach, Voice */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-[#8D8A83] hover:text-[#FF7A00] hover:bg-[#FF7A00]/10 border border-transparent hover:border-[#FF7A00]/25 transition-all cursor-pointer shrink-0"
              title="Attach student document (fee slip, ID proof, medical note)"
              aria-label="Attach document"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoice}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/30 animate-pulse'
                  : 'text-[#8D8A83] hover:text-[#FF7A00] hover:bg-[#FF7A00]/10'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Right Controls: Command Hint + Orange Arrow Send */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline text-[11px] font-mono text-[#8D8A83]/70">
              ⌘ + Enter
            </span>

            <button
              type="submit"
              disabled={(!text.trim() && !attachedFile) || disabled || isListening}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all ${
                (text.trim() || attachedFile) && !disabled && !isListening
                  ? 'bg-[#FF7A00] text-black hover:bg-[#FF8A1F] active:scale-95 cursor-pointer font-bold shadow-[0_0_12px_rgba(255,122,0,0.35)]'
                  : 'bg-[#1C1D24] text-[#8D8A83]/40 cursor-not-allowed border border-[#282935]'
              }`}
              title="Send inquiry"
              aria-label="Send inquiry"
            >
              <ArrowRight className="w-4 h-4 text-inherit" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
