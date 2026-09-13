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
  X,
  MessageSquareWarning,
} from 'lucide-react';
import { RoutingFlowVector } from '@/components/vectors/RoutingFlowVector';

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<string | null>(null);

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

  const handleThumbsDown = () => {
    if (feedback === 'down') {
      setFeedback(null);
      setShowFeedbackModal(false);
      setFeedbackCategory(null);
    } else {
      setFeedback('down');
      setShowFeedbackModal(true);
    }
  };

  const submitFeedbackCategory = (cat: string) => {
    setFeedbackCategory(cat);
    setTimeout(() => {
      setShowFeedbackModal(false);
    }, 1200);
  };

  // Helper to render markdown-like formatting (bold, code chips, inline [1] citation markers)
  const renderFormattedText = (text: string) => {
    // Split by citation markers like [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const citMatch = part.match(/^\[(\d+)\]$/);
      if (citMatch) {
        const marker = part;
        const matchingCitation = message.citations?.find((c) => c.marker === marker);
        return (
          <button
            key={index}
            onClick={() => {
              if (matchingCitation) {
                onOpenCitation(matchingCitation);
              }
            }}
            title={matchingCitation ? `View source: ${matchingCitation.title}` : 'View Citation'}
            className="inline-flex items-center align-super mx-0.5 px-1.5 py-0.2 rounded-md bg-[var(--surface-2)] hover:bg-[var(--accent)]/15 border border-[var(--border-subtle)] text-[11px] font-mono font-semibold text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer transition-all duration-150 active:scale-95"
          >
            {marker}
          </button>
        );
      }

      // Format bold text **word**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return (
                <strong key={bIdx} className="font-semibold text-[var(--foreground)]">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            // Format inline code `code`
            const codeParts = bPart.split(/(`.*?`)/g);
            return (
              <span key={bIdx}>
                {codeParts.map((cPart, cIdx) => {
                  if (cPart.startsWith('`') && cPart.endsWith('`')) {
                    return (
                      <code
                        key={cIdx}
                        className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[12px] font-mono text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {cPart.slice(1, -1)}
                      </code>
                    );
                  }
                  return cPart;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end my-4 sm:my-5 animate-in fade-in duration-200 w-full">
        <div className="max-w-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--foreground)] rounded-3xl rounded-tr-md px-5 py-3 text-[15px] sm:text-base leading-relaxed shadow-xs">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 my-4 sm:my-5 animate-in fade-in duration-200 w-full relative">
      {/* Clean Domain Routing Header with Vector Flow Graphic */}
      {message.domainLabel && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-0.5">
          <RoutingFlowVector
            domainLabel={message.domainLabel}
            confidence={message.confidence}
          />
          <span className="text-xs text-[var(--text-tertiary)] ml-auto">
            {message.timestamp}
          </span>
        </div>
      )}

      {/* Main Prose Bubble */}
      <div className="text-[15px] sm:text-base leading-relaxed text-[var(--foreground)] space-y-3 pl-1">
        <div className="leading-relaxed whitespace-pre-line">
          {renderFormattedText(message.content)}
        </div>

        {/* Action Checklist Container */}
        {message.checklist && message.checklist.length > 0 && (
          <div className="p-4 sm:p-4.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2 my-2 shadow-xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] block">
              Action Checklist
            </span>
            <ul className="space-y-2 pt-0.5">
              {message.checklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--foreground)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-xs font-semibold text-[var(--accent)] mt-0.5 shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{renderFormattedText(item)}</span>
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
              className="inline-flex items-center gap-2 text-xs text-[var(--foreground)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2 rounded-full transition-all border border-[var(--border-subtle)] font-medium"
            >
              <span>{message.portalLink.label}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </a>
          </div>
        )}

        {/* Interactive Clarification Card */}
        {message.clarification && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-1)] space-y-3 my-2 border border-[var(--border-subtle)] shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
              <HelpCircle className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
              <span>{message.clarification.prompt}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {message.clarification.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectClarification?.(option)}
                  className="text-left p-3.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--foreground)] transition-all flex flex-col gap-1 group cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--border-medium)]"
                >
                  <span className="font-semibold text-xs leading-snug">
                    {option.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
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
              <AlertCircle className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
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

        {/* Grounding Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {message.citations.map((citation) => (
              <button
                key={citation.id}
                onClick={() => onOpenCitation(citation)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-xs text-[var(--foreground)] transition-all cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <span className="font-bold font-mono text-[11px] text-[var(--text-secondary)]">{citation.marker}</span>
                <span className="text-[11.5px] truncate max-w-xs text-[var(--text-secondary)]">
                  {citation.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Contextual Follow-up Suggestion Chips */}
        {message.followUps && message.followUps.length > 0 && (
          <div className="pt-2 space-y-1.5 border-t border-[var(--border-subtle)]/60 my-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] block">
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
          aria-label="Copy message"
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
          aria-label={isSpeaking ? 'Stop speech' : 'Read aloud'}
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
          aria-label="Helpful resolution"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleThumbsDown}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            feedback === 'down'
              ? 'text-red-400 bg-[var(--surface-2)]'
              : 'hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
          }`}
          title="Not helpful (Provide Feedback)"
          aria-label="Not helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Feedback Categorization Popover */}
      {showFeedbackModal && (
        <div className="absolute bottom-10 left-1 z-20 w-80 p-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
              <MessageSquareWarning className="w-3.5 h-3.5 text-amber-400" />
              <span>Help us calibrate CampusOne</span>
            </div>
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="text-[var(--text-tertiary)] hover:text-[var(--foreground)] p-1 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {feedbackCategory ? (
            <div className="py-3 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Feedback logged into live audit telemetry.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[var(--text-secondary)]">Why was this response not helpful?</p>
              {[
                { id: 'wrong_dept', label: 'Routed to incorrect department' },
                { id: 'outdated', label: 'Outdated or superseded policy' },
                { id: 'inaccurate', label: 'Factually inaccurate details' },
                { id: 'needs_human', label: 'Should have escalated to staff' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => submitFeedbackCategory(item.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--surface-2)] text-[var(--foreground)] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] group-hover:text-[var(--accent)] font-mono">
                    Submit →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
