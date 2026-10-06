'use client';

import React, { useState, useEffect } from 'react';
import { Citation } from '@/lib/demoFixtures';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ArrowUpRight,
  FileText,
  GitFork,
} from 'lucide-react';

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
  onProceedForm?: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  onClose,
  onProceedForm,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (citation) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [citation, onClose]);

  if (!citation) return null;

  const handleCopyCitation = () => {
    const authorityStr = citation.authority || citation.custodian || 'University Authority';
    const fullCitationText = `${citation.title}${citation.section ? ` - ${citation.section}` : ''}\nAuthority: ${authorityStr}\nExcerpt: ${citation.excerpt}`;
    navigator.clipboard.writeText(fullCitationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculatedMatchScore =
    citation.matchScore ||
    (citation.groundingScore ? `${Math.round(citation.groundingScore * 100)}% Match` : 'Verified Source');

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        aria-hidden="true"
      />

      <aside className="fixed lg:static inset-y-0 right-0 z-50 lg:z-auto w-full sm:w-[420px] lg:w-[440px] xl:w-[480px] shrink-0 bg-[#0C0D10] p-5 sm:p-6 shadow-2xl lg:shadow-none flex flex-col justify-between animate-in slide-in-from-right duration-250 border-l border-[#22232B] text-[#F5F3ED] h-full overflow-hidden transition-all font-sans select-none">
        {/* Top Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none">
          {/* Eyebrow & Status Row */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 text-[#FF7A00] font-mono text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Source</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono bg-[#0D2418] border border-[#10B981]/40 text-[#10B981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>FERPA Compliant</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8D8A83] hover:text-[#F5F3ED] p-1 rounded hover:bg-[#15151A] transition-colors cursor-pointer"
                title="Close Inspector"
                aria-label="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Title & Subtitle */}
          <div className="space-y-1">
            <h2 className="font-serif text-xl sm:text-[22px] font-bold text-[#F5F3ED] leading-snug">
              {citation.title}
            </h2>
            {citation.section && (
              <p className="text-xs text-[#8D8A83] font-sans">
                {citation.section}
              </p>
            )}
          </div>

          {/* 2x2 Authority & Verification Grid */}
          <div className="rounded-xl border border-[#22232B] bg-[#121317] p-3.5 grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 border-r border-[#1F2027] pr-2">
              <span className="block font-mono text-[9.5px] text-[#8D8A83] uppercase tracking-wider">
                AUTHORITY
              </span>
              <span className="font-medium text-[#F5F3ED] truncate block">
                {citation.authority || citation.custodian || 'University Authority'}
              </span>
            </div>

            <div className="space-y-1 pl-1">
              <span className="block font-mono text-[9.5px] text-[#8D8A83] uppercase tracking-wider">
                EFFECTIVE DATE
              </span>
              <span className="font-medium text-[#F5F3ED] truncate block">
                {citation.effectiveDate || citation.version || 'Active Policy'}
              </span>
            </div>

            <div className="space-y-1 border-r border-[#1F2027] pr-2 pt-2 border-t">
              <span className="block font-mono text-[9.5px] text-[#8D8A83] uppercase tracking-wider">
                RECORD ID
              </span>
              <span className="font-mono text-[#F5F3ED] truncate block text-[11px]">
                {citation.recordId || citation.id}
              </span>
            </div>

            <div className="space-y-1 pl-1 pt-2 border-t border-[#1F2027]">
              <span className="block font-mono text-[9.5px] text-[#8D8A83] uppercase tracking-wider">
                MATCH SCORE
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[#10B981] font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>{calculatedMatchScore}</span>
              </div>
            </div>
          </div>

          {/* Verbatim Statute Excerpt Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-[#8D8A83] uppercase tracking-wider font-semibold">
                VERBATIM STATUTE EXCERPT
              </span>
              {citation.subclause && (
                <span className="text-[10.5px] text-[#8D8A83]">
                  {citation.subclause}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-[#22232B] bg-[#121317] p-4 space-y-3">
              <div className="font-mono text-xs font-bold text-[#F5F3ED]">
                {citation.statuteTitle || citation.title}
              </div>

              <p className="text-xs text-[#A9A8A2] leading-relaxed font-sans">
                {citation.excerpt}
              </p>

              {/* Subclauses breakdown */}
              {citation.subclauses && citation.subclauses.length > 0 && (
                <div className="space-y-2.5 pt-1 text-xs">
                  {citation.subclauses.map((sub, idx) => (
                    <div key={idx} className="leading-relaxed text-[#A9A8A2]">
                      <strong className="text-[#FF7A00] font-mono mr-1.5">
                        {sub.marker} {sub.title}
                      </strong>
                      <span>{sub.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Associated Form & Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
            {citation.associatedForm && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#16171E] border border-[#242531] text-[#F5F3ED]">
                <FileText className="w-3 h-3 text-[#FF7A00]" />
                <span>Associated Form: <strong>{citation.associatedForm}</strong></span>
              </div>
            )}

            {citation.destination && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#16171E] border border-[#242531] text-[#F5F3ED]">
                <GitFork className="w-3 h-3 text-[#FF7A00]" />
                <span>Destination: <strong>{citation.destination}</strong></span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0D2418] border border-[#10B981]/30 text-[#10B981]">
              <Check className="w-3 h-3 text-[#10B981]" />
              <span>Status: <strong>{citation.mandateStatus || 'Active Mandate'}</strong></span>
            </div>
          </div>
        </div>

        {/* Bottom Inspector Action Bar */}
        <div className="pt-3 border-t border-[#1F2027] shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCitation}
              className="flex-1 py-2 px-3 rounded-lg border border-[#262731] hover:border-[#383A49] bg-[#16171E] text-xs font-mono text-[#F5F3ED] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8D8A83]" />
                  <span>Copy Citation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onProceedForm) {
                  onProceedForm();
                } else if (citation.sourceUri) {
                  window.open(citation.sourceUri, '_blank');
                }
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-[#FF7A00] hover:bg-[#FF8A1F] text-black text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <span>
                {citation.associatedForm ? `Proceed with ${citation.associatedForm}` : 'Open Policy Source'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
