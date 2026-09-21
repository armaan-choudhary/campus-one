'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { CampusOneMark } from './CampusOneMark';

export const InstitutionalTrust: React.FC = () => {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-8 lg:px-12 bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
      <div className="max-w-5xl mx-auto space-y-10 font-mono">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <CampusOneMark size={12} className="text-indigo-400" />
            <span className="uppercase tracking-wider font-semibold text-[var(--foreground)]">POLICY PROVENANCE</span>
            <span className="text-[var(--text-tertiary)]">&bull;</span>
            <span>VERIFIED CITATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)] font-sans">
            Every answer has receipts.
          </h2>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-sans max-w-xl leading-relaxed">
            CampusOne does not guess or invent policies. Every statement is cited directly from official university regulations.
          </p>
        </div>

        {/* Official University Document Stationery */}
        <div className="w-full max-w-3xl rounded border border-zinc-700/60 bg-[var(--background)] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Top Document Header Line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4 mb-5 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
            <div>
              <span className="font-bold text-[var(--foreground)]">OFFICE OF THE REGISTRAR</span>
              <span className="mx-2">&bull;</span>
              <span>ACADEMIC AFFAIRS</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SOURCE VERIFIED</span>
            </div>
          </div>

          {/* Document Title & Reference */}
          <div className="space-y-1 mb-5">
            <div className="text-[11px] text-indigo-400 font-bold tracking-wider uppercase">
              Academic Regulations Handbook 2026–2027
            </div>
            <div className="text-sm sm:text-base font-bold text-[var(--foreground)] font-sans">
              &sect; 7.2 Medical Appeals &amp; Excused Absence
            </div>
          </div>

          {/* Excerpt Body */}
          <div className="p-4 rounded bg-[var(--surface-1)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] leading-relaxed font-mono mb-5">
            &ldquo;Students unable to complete scheduled examinations due to certified acute medical hospitalization shall be granted an excused absence. Faculty are required to provide an equitable makeup examination within 14 calendar days of medical clearance or adjust semester weighting upon petition approval.&rdquo;
          </div>

          {/* Document Footer & Original Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-[11px] text-[var(--text-tertiary)]">
            <div>
              <span className="text-[var(--text-secondary)]">Registrar &bull; Approved Aug 14, 2026 &bull; Page 18</span>
            </div>

            <Link
              href="/workspace?role=student&q=View%20Academic%20Regulations%20Handbook%20Section%207.2"
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>View original source &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
