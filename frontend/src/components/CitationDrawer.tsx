'use client';

import React, { useState } from 'react';
import { Citation } from '@/lib/demoFixtures';
import {
  X,
  ShieldCheck,
  ExternalLink,
  FileText,
  Copy,
  Check,
  BookOpen,
  Flag,
} from 'lucide-react';
import { GroundingRadialGauge } from '@/components/vectors/GroundingRadialGauge';

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [viewMode, setViewMode] = useState<'excerpt' | 'context'>('excerpt');

  if (!citation) return null;

  const handleCopyExcerpt = () => {
    navigator.clipboard.writeText(citation.excerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 2500);
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        aria-hidden="true"
      />

      <aside className="fixed lg:static inset-y-0 right-0 z-50 lg:z-auto w-full sm:w-[400px] lg:w-[400px] shrink-0 bg-[var(--surface-1)] p-6 sm:p-7 shadow-2xl lg:shadow-none flex flex-col justify-between animate-in slide-in-from-right duration-250 border-l border-[var(--border-subtle)] h-full overflow-hidden transition-all">
      <div className="space-y-5 overflow-y-auto pr-1">
        {/* Header with Generous Space */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--foreground)] tracking-tight block">
                Verified Grounding Source
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Citation Marker {citation.marker}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--foreground)] p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Close Drawer"
            aria-label="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--accent)] bg-[var(--surface-2)] px-3 py-1 rounded-full inline-block border border-[var(--border-subtle)]">
                Authoritative University Corpus
              </span>
              
              {/* Toggle view mode */}
              <div className="flex items-center bg-[var(--surface-2)] p-0.5 rounded-full text-[11px] border border-[var(--border-subtle)]">
                <button
                  onClick={() => setViewMode('excerpt')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    viewMode === 'excerpt'
                      ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Excerpt
                </button>
                <button
                  onClick={() => setViewMode('context')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    viewMode === 'context'
                      ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Document
                </button>
              </div>
            </div>

            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight leading-snug flex items-start gap-2 pt-2">
              <FileText className="w-4 h-4 text-[var(--accent)] shrink-0 mt-1" />
              <span>{citation.title}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] pl-6">{citation.section}</p>
          </div>

          {/* View Mode: Excerpt vs Full Section Context */}
          {viewMode === 'excerpt' ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface-2)] space-y-3 border border-[var(--border-subtle)] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] block">
                  Policy Excerpt Verbatim
                </span>
                <button
                  onClick={handleCopyExcerpt}
                  className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 cursor-pointer"
                  aria-label="Copy excerpt"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[var(--foreground)] italic">
                &ldquo;{citation.excerpt}&rdquo;
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-[var(--surface-2)] space-y-2 border border-[var(--border-subtle)] text-xs text-[var(--foreground)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] pb-1 border-b border-[var(--border-subtle)]">
                <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Handbook Section Context (v2026.1)</span>
              </div>
              <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed pt-1">
                ... Matriculated candidates shall comply with institutional registry timelines.
              </p>
              <div className="p-2.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--foreground)] font-medium text-xs leading-relaxed">
                👉 &ldquo;{citation.excerpt}&rdquo;
              </div>
              <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                Inquiries regarding waivers or appeals must be submitted in writing within 14 calendar days of transaction completion.
              </p>
            </div>
          )}

          {/* Precision Vector Grounding Meter */}
          <GroundingRadialGauge
            score={citation.groundingScore}
            label="Policy Grounding Confidence"
          />

          {/* Metadata Rows */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Corpus Version</span>
              <span className="text-[var(--foreground)] font-mono font-medium">{citation.version}</span>
            </div>
            {citation.custodian && (
              <div className="flex flex-col py-2 border-b border-[var(--border-subtle)] gap-0.5">
                <span className="text-[var(--text-secondary)]">Governing Authority</span>
                <span className="text-[var(--foreground)] font-medium leading-snug">{citation.custodian}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
        <a
          href={citation.sourceUri || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-full text-xs font-semibold text-[var(--foreground)] flex items-center justify-center gap-2 transition-all border border-[var(--border-subtle)] shadow-xs hover:border-[var(--accent)]"
        >
          <span>Open Full Handbook (PDF Document)</span>
          <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
        </a>

        <button
          onClick={handleReport}
          className="w-full py-2 px-3 text-[11px] text-[var(--text-secondary)] hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{reported ? 'Discrepancy reported to Registrar' : 'Report discrepancy in this policy'}</span>
        </button>
      </div>
      </aside>
    </>
  );
};
