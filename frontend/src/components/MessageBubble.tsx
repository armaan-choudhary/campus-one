'use client';

import React, { useState } from 'react';
import { Message, Citation, ClarificationOption } from '@/lib/demoFixtures';
import {
  Check,
  X,
  MessageSquareWarning,
  Sparkles,
  Landmark,
  FileText,
  Paperclip,
  GitFork,
  BookOpen,
  ArrowUpRight,
  Info,
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
            className="inline-flex items-center align-super mx-0.5 px-1.5 py-0.2 rounded-md bg-[#16171D] hover:bg-[#1C1E26] border border-[#252730] hover:border-[#FF7A00] text-[11px] font-mono font-semibold text-[#FF7A00] cursor-pointer transition-all duration-150 active:scale-95"
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
              const boldContent = bPart.slice(2, -2);
              return (
                <strong
                  key={bIdx}
                  className="font-semibold text-[#F5F3ED]"
                >
                  {boldContent}
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
                        className="px-1.5 py-0.5 rounded bg-[#1A1C22] text-[12px] font-mono text-[#FF7A00] border border-[#282A33]"
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
    const authorName = message.authorName || 'You';
    const initials = authorName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

    return (
      <div className="py-4 space-y-2 animate-in fade-in duration-150 border-b border-[#1E1E24] pb-6">
        {/* User Identity & Tag Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1F2027] border border-[#2E303C] flex items-center justify-center text-[10px] font-bold text-[#F5F3ED] shrink-0">
              {initials}
            </div>
            <span className="font-semibold text-[#F5F3ED]">
              {authorName}
            </span>
            {message.authorRole && (
              <span className="text-[#8D8A83]">
                {message.authorRole}
              </span>
            )}
            {message.userCategory && (
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider border border-[#2A2B35] bg-[#16171D] text-[#A1A1AA]">
                {message.userCategory}
              </span>
            )}
            {message.userUrgency && (
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider bg-[#3B1111] text-[#EF4444] border border-[#7F1D1D]/50">
                {message.userUrgency.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#8D8A83] font-mono">{message.timestamp}</span>
        </div>

        {/* Message Query Text */}
        <p className="text-base sm:text-[17px] text-[#F5F3ED] font-sans leading-relaxed pt-1">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="py-5 space-y-4 animate-in fade-in duration-150">
      {/* Assistant Header Row */}
      <div className="flex items-center justify-between text-xs font-mono pb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span className="font-semibold text-[#F5F3ED]">CampusOne</span>
        </div>
        <span className="text-[11px] text-[#8D8A83] font-mono">{message.timestamp}</span>
      </div>

      {/* Main Prose Text */}
      <div className="text-sm sm:text-[15px] leading-relaxed text-[#F5F3ED] whitespace-pre-line space-y-3 font-sans">
        {renderFormattedText(message.content)}
      </div>

      {/* High-Fidelity Structured Department Routing Card */}
      {message.routingCard && (
        <div className="rounded-xl border border-[#23242E] bg-[#131418] p-4 sm:p-5 space-y-4 my-2 shadow-lg">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#FF7A00] shrink-0" />
              <span className="font-semibold text-sm sm:text-[15px] text-[#F5F3ED]">
                {message.routingCard.departmentTitle}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold bg-[#FF7A00] text-black w-fit shrink-0 tracking-wide">
              {message.routingCard.routingTag}
            </span>
          </div>

          {/* Card Summary Protocol */}
          <p className="text-xs sm:text-[13px] text-[#A1A1AA] leading-relaxed">
            {message.routingCard.summary}
          </p>

          {/* 3 Step Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {message.routingCard.steps.map((st, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#0E0F13] border border-[#1E1E26] space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F3ED]">
                  {idx === 0 ? (
                    <FileText className="w-3.5 h-3.5 text-[#FF7A00]" />
                  ) : idx === 1 ? (
                    <Paperclip className="w-3.5 h-3.5 text-[#FF7A00]" />
                  ) : (
                    <GitFork className="w-3.5 h-3.5 text-[#FF7A00]" />
                  )}
                  <span>{st.title}</span>
                </div>
                <p className="text-[11px] text-[#8D8A83] leading-relaxed">
                  {st.description}
                </p>
              </div>
            ))}
          </div>

          {/* Card Footer: Source & Side Panel Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#1F1F26] text-xs">
            <div className="flex items-center gap-2 text-[#8D8A83]">
              <BookOpen className="w-3.5 h-3.5 text-[#FF7A00] shrink-0" />
              <span className="text-[11.5px]">{message.routingCard.sourceLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (message.citations?.[0]) {
                    onOpenCitation(message.citations[0]);
                  }
                }}
                className="px-2.5 py-1 rounded border border-[#FF7A00]/40 text-[#FF7A00] text-xs font-mono font-medium bg-[#FF7A00]/5 hover:bg-[#FF7A00]/15 cursor-pointer transition-colors"
              >
                View source
              </button>
              {message.routingCard.portalAction && (
                <a
                  href={message.routingCard.portalAction.url || '#'}
                  className="inline-flex items-center gap-1 text-[11.5px] font-mono text-[#F5F3ED] hover:text-[#FF7A00] transition-colors"
                >
                  <span>{message.routingCard.portalAction.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#FF7A00]" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proactive Auto-Populate Note */}
      {message.routingCard?.proactiveNote && (
        <div className="flex items-center gap-2 text-xs text-[#8D8A83] font-sans pt-0.5">
          <Info className="w-3.5 h-3.5 text-[#FF7A00] shrink-0" />
          <span>{message.routingCard.proactiveNote}</span>
        </div>
      )}

      {/* Fallback Action Steps Checklist (for general responses) */}
      {!message.routingCard && message.checklist && message.checklist.length > 0 && (
        <div className="space-y-2 pt-1 pb-1">
          <div className="font-mono text-xs text-[#8D8A83]">
            Action steps
          </div>
          <ol className="divide-y divide-[#1F1F1F] border-y border-[#1F1F1F]">
            {message.checklist.map((item, idx) => (
              <li key={idx} className="py-2.5 flex items-start gap-3 text-xs sm:text-sm text-[#F5F3ED]">
                <span className="font-mono text-xs text-[#FF7A00] font-bold shrink-0 pt-0.5">
                  0{idx + 1}
                </span>
                <span className="leading-relaxed">{renderFormattedText(item)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Verified Sources (when no routing card is present) */}
      {!message.routingCard && message.citations && message.citations.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="font-mono text-xs text-[#8D8A83]">
            Sources
          </div>
          <div className="divide-y divide-[#292929] border-y border-[#292929]">
            {message.citations.map((citation, idx) => (
              <button
                key={citation.id}
                onClick={() => onOpenCitation(citation)}
                className="w-full py-2.5 flex items-start justify-between gap-3 text-left hover:bg-[#111111] px-1 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[#FF7A00] font-bold pt-0.5">
                    0{idx + 1}
                  </span>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-[#F5F3ED] group-hover:text-white group-hover:underline">
                      {citation.title}
                    </span>
                    {citation.section && (
                      <div className="text-[11px] font-mono text-[#8D8A83] pt-0.5">
                        {citation.section} · {citation.version || 'v2026.1'}
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#8D8A83] group-hover:text-[#FF7A00] shrink-0 pt-0.5">
                  VIEW &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Clarification Card */}
      {(() => {
        const clarificationData =
          message.clarification ||
          (message.content.toLowerCase().includes('which of the following') ||
          message.content.toLowerCase().includes('which area can i help') ||
          message.content.toLowerCase().includes('clarify which')
            ? {
                prompt: message.content,
                options: [
                  { id: 'academics', label: 'Academic Services & Exam Requests', domain: 'academics' },
                  { id: 'student_affairs', label: 'Medical Documentation & Student Affairs', domain: 'hr' },
                  { id: 'financial_services', label: 'Tuition & Fee Policy Inquiries', domain: 'fees' },
                  { id: 'it_support', label: 'Campus IT & Technical Inquiries', domain: 'it' },
                ],
              }
            : null);

        if (!clarificationData || !clarificationData.options?.length) return null;

        return (
          <div className="p-4 rounded border border-[#292929] bg-[#111111] space-y-3">
            {clarificationData.prompt &&
              clarificationData.prompt.trim() !== message.content?.trim() && (
                <div className="font-mono text-xs text-[#F5F3ED]">
                  {clarificationData.prompt}
                </div>
              )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {clarificationData.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectClarification?.(option)}
                  className="p-3 text-left border border-[#292929] hover:border-[#FF7A00] bg-[#151515] transition-colors rounded group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#F5F3ED] block group-hover:text-[#FF7A00]">
                    {option.label}
                  </span>
                  {option.domain && (
                    <span className="text-[11px] font-mono text-[#8D8A83] block pt-0.5 uppercase">
                      Queue: {option.domain}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Human Escalation / Handoff State */}
      {message.handoff && (
        <div className="p-4 rounded border border-[#292929] bg-[#151515] space-y-1.5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#FF7A00]">
            — ESCALATED TO HUMAN STAFF //
          </div>
          <div className="text-xs sm:text-sm text-[#F5F3ED]">
            Work order <strong className="font-mono">{message.handoff.ticketId}</strong> assigned to{' '}
            <strong>{message.handoff.department}</strong>.
          </div>
        </div>
      )}

      {/* Contextual Follow-up Suggestions */}
      {message.followUps && message.followUps.length > 0 && (
        <div className="pt-2 space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#8D8A83]">
            — FOLLOW UP //
          </div>
          <div className="flex flex-wrap gap-2">
            {message.followUps.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFollowUp?.(promptText)}
                className="text-xs font-mono text-[#8D8A83] hover:text-[#F5F3ED] border border-[#292929] hover:border-[#FF7A00] px-3 py-1 rounded transition-colors cursor-pointer"
              >
                {promptText} &rarr;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Text Actions */}
      <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-[#8D8A83]">
        <button
          onClick={handleCopy}
          className="hover:text-[#F5F3ED] transition-colors cursor-pointer"
        >
          {copied ? 'copied' : 'copy'}
        </button>
        <span>·</span>
        <button
          onClick={handleToggleSpeak}
          className="hover:text-[#F5F3ED] transition-colors cursor-pointer"
        >
          {isSpeaking ? 'stop audio' : 'listen'}
        </button>
        <span>·</span>
        <button
          onClick={handleThumbsDown}
          className="hover:text-[#F5F3ED] transition-colors cursor-pointer"
        >
          report issue
        </button>
      </div>

      {/* Mini Feedback Categorization Popover */}
      {showFeedbackModal && (
        <div className="mt-2 p-3 rounded-xl bg-[#18191E] border border-[#282A33] shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282A33]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <MessageSquareWarning className="w-3.5 h-3.5 text-amber-400" />
              <span>Help calibrate CampusOne</span>
            </div>
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="text-[#8E8F94] hover:text-white p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {feedbackCategory ? (
            <div className="py-2 text-center text-xs text-emerald-400 flex items-center justify-center gap-2 font-mono">
              <Check className="w-4 h-4" />
              <span>Feedback recorded in audit telemetry.</span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-[#A1A1AA] mb-1">Why was this response not helpful?</p>
              {[
                { id: 'wrong_dept', label: 'Routed to incorrect department' },
                { id: 'outdated', label: 'Outdated or superseded policy' },
                { id: 'inaccurate', label: 'Factually inaccurate details' },
                { id: 'needs_human', label: 'Should have escalated to staff' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => submitFeedbackCategory(item.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#1C1E26] text-zinc-200 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-[#666666] group-hover:text-[#F97316] font-mono">
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
