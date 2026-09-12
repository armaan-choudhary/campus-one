'use client';

import React, { useState } from 'react';
import { Citation } from '@/lib/demoFixtures';
import {
  X,
  ShieldCheck,
  ExternalLink,
  FileText,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopyExcerpt = () => {
    navigator.clipboard.writeText(citation.excerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[var(--surface-1)] p-8 sm:p-9 shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-250 border-l border-[var(--border-subtle)] sm:rounded-l-3xl transition-all">
      <div className="space-y-6">
        {/* Header with Generous Vertical Space */}
        <div className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] tracking-tight block">
                Verified Grounding Source
              </span>
              <span className="text-[11px] font-mono text-[var(--accent)]">
                Citation Marker {citation.marker}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--foreground)] p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-[var(--accent)] bg-[var(--surface-2)] px-3 py-1 rounded-full inline-block border border-[var(--border-subtle)]">
              Authoritative University Corpus
            </span>
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight leading-snug flex items-start gap-2 pt-1">
              <FileText className="w-4 h-4 text-[var(--accent)] shrink-0 mt-1" />
              <span>{citation.title}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] pl-6">{citation.section}</p>
          </div>

          {/* Highlighted Excerpt Container with Copy Action */}
          <div className="p-5 rounded-3xl bg-[var(--surface-2)] space-y-3 border border-[var(--border-subtle)] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] block">
                Policy Excerpt Verbatim
              </span>
              <button
                onClick={handleCopyExcerpt}
                className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 cursor-pointer"
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
              "{citation.excerpt}"
            </p>
          </div>

          {/* Metadata Rows with Comfortable Spacing */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Grounding Confidence</span>
              <span className="text-[var(--accent)] font-semibold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                {(citation.groundingScore * 100).toFixed(0)}% Authoritative
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Corpus Version</span>
              <span className="text-[var(--foreground)] font-mono font-medium">{citation.version}</span>
            </div>
            {citation.custodian && (
              <div className="flex flex-col py-2.5 border-b border-[var(--border-subtle)] gap-1">
                <span className="text-[var(--text-secondary)]">Governing Authority</span>
                <span className="text-[var(--foreground)] font-medium leading-snug">{citation.custodian}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Pill Button with Generous Spacing */}
      <div className="pt-6 border-t border-[var(--border-subtle)]">
        <a
          href={citation.sourceUri || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-full text-xs font-semibold text-[var(--foreground)] flex items-center justify-center gap-2.5 transition-all border border-[var(--border-subtle)] shadow-xs hover:border-[var(--accent)]"
        >
          <span>Open Full Handbook (PDF Document)</span>
          <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
        </a>
      </div>
    </aside>
  );
};
