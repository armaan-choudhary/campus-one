'use client';

import React, { useState } from 'react';
import { Message, Citation, ClarificationOption } from '@/lib/demoFixtures';
import {
  Sparkles,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Building2,
  FileCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onOpenCitation: (citation: Citation) => void;
  onSelectClarification?: (option: ClarificationOption) => void;
  onSelectFollowUp?: (prompt: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOpenCitation,
  onSelectClarification,
  onSelectFollowUp,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end my-4 sm:my-5 animate-in fade-in duration-200">
        <div className="max-w-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-3xl rounded-tr-md px-5 py-3 text-[15px] sm:text-base leading-relaxed shadow-xs">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 my-4 sm:my-5 animate-in fade-in duration-200 max-w-2xl">
      {/* Friendly Domain Chip Header */}
      {message.domainLabel && (
        <div className="flex items-center gap-2.5 text-xs mb-0.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--accent)] font-medium border border-[var(--border-subtle)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{message.domainLabel}</span>
          </div>
          {message.confidence && (
            <span className="text-[11px] text-[var(--text-secondary)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
              {(message.confidence * 100).toFixed(0)}% authoritative match
            </span>
          )}
          <span className="text-[11px] text-[var(--text-tertiary)] ml-auto font-mono">
            {message.timestamp}
          </span>
        </div>
      )}

      {/* Main Prose Bubble */}
      <div className="text-[15px] sm:text-base leading-relaxed text-[var(--foreground)] space-y-3 pl-1">
        <p className="leading-relaxed">{message.content}</p>

        {/* Action Checklist Container */}
        {message.checklist && message.checklist.length > 0 && (
          <div className="p-4 sm:p-4.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2 my-2 shadow-xs">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] block font-mono">
              Action Checklist
            </span>
            <ul className="space-y-2 pt-0.5">
              {message.checklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--foreground)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[11px] font-bold text-[var(--accent)] mt-0.5 shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="leading-snug pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Portal Action Chip */}
        {message.portalLink && (
          <div className="pt-1">
            <a
              href={message.portalLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2 rounded-full transition-all border border-[var(--border-subtle)] shadow-xs font-medium"
            >
              <span>{message.portalLink.label}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Interactive Clarification Card */}
        {message.clarification && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-1)] space-y-3 my-2 border border-[var(--border-subtle)] shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
              <HelpCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{message.clarification.prompt}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {message.clarification.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectClarification?.(option)}
                  className="text-left p-3.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--foreground)] transition-all flex flex-col gap-1 group cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--accent)] shadow-xs"
                >
                  <span className="font-semibold text-xs group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {option.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    Select to route query
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Human Escalation / Handoff Banner */}
        {message.handoff && (
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] space-y-2 my-2 border border-[var(--border-subtle)] shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
              <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>Escalated to Department Queue</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-xs text-[var(--foreground)] bg-[var(--surface-1)] border border-[var(--border-subtle)] px-3 py-1 rounded-full font-mono font-semibold">
                Ticket {message.handoff.ticketId}
              </span>
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 pl-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                {message.handoff.department}
              </span>
            </div>
          </div>
        )}

        {/* Material 3 Pill Citation Badges */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            {message.citations.map((citation) => (
              <button
                key={citation.id}
                onClick={() => onOpenCitation(citation)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[var(--accent)] text-xs text-[var(--accent)] transition-all group cursor-pointer shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span className="font-bold font-mono text-[11px]">{citation.marker}</span>
                <span className="text-[11.5px] text-[var(--foreground)] truncate max-w-xs font-normal">
                  {citation.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Contextual Follow-up Suggestion Chips */}
        {message.followUps && message.followUps.length > 0 && (
          <div className="pt-2 space-y-1.5 border-t border-[var(--border-subtle)]/60 my-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] block">
              Suggested next questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {message.followUps.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectFollowUp?.(promptText)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-xs text-[var(--foreground)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-xs text-left group"
                >
                  <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0" />
                  <span className="group-hover:text-[var(--accent)] transition-colors font-normal text-xs">
                    {promptText}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Reaction Buttons */}
      <div className="flex items-center gap-1 pt-0.5 pl-1 text-[var(--text-tertiary)]">
        <button
          onClick={handleCopy}
          className="p-2 hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] rounded-full transition-colors cursor-pointer"
          title="Copy message"
        >
          {copied ? <Check className="w-4 h-4 text-[var(--accent)]" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={handleToggleSpeak}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isSpeaking
              ? 'text-[var(--accent)] bg-[var(--surface-2)] animate-pulse'
              : 'hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
          }`}
          title={isSpeaking ? 'Stop speech' : 'Read aloud'}
        >
          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            feedback === 'up'
              ? 'text-[var(--accent)] bg-[var(--surface-2)]'
              : 'hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
          }`}
          title="Helpful resolution"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            feedback === 'down'
              ? 'text-red-400 bg-[var(--surface-2)]'
              : 'hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
          }`}
          title="Not helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
