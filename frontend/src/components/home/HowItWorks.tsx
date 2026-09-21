'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CampusOneMark } from './CampusOneMark';

const STEPS = [
  {
    num: '01',
    title: 'ASK',
    quote: '“Can I appeal this?”',
  },
  {
    num: '02',
    title: 'UNDERSTAND',
    quote: 'Academic + financial',
  },
  {
    num: '03',
    title: 'CONNECT',
    quote: 'Registrar + Bursar',
  },
  {
    num: '04',
    title: 'RESOLVE',
    quote: 'One sourced answer',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 lg:py-20 px-4 sm:px-8 lg:px-12 bg-[var(--background)] border-b border-[var(--border-subtle)]">
      <div className="max-w-5xl mx-auto space-y-8 font-mono">
        {/* Tiny Header */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <CampusOneMark size={12} className="text-indigo-400" />
          <span className="uppercase tracking-wider font-semibold text-[var(--foreground)]">WORKFLOW</span>
          <span className="text-[var(--text-tertiary)]">&bull;</span>
          <span>FOUR STEPS &bull; ZERO BOUNCING</span>
        </div>

        {/* Compact Horizontal Sequence: 01 → 02 → 03 → 04 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pt-2">
          {STEPS.map((step, idx) => (
            <div
              key={step.num}
              className="border-t border-[var(--border-subtle)] pt-4 space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl lg:text-3xl font-light text-[var(--text-tertiary)] group-hover:text-indigo-400 transition-colors">
                  {step.num}
                </span>
                {idx < STEPS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] hidden lg:block" />
                )}
              </div>

              <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold">
                {step.title}
              </div>

              <div className="text-xs font-sans font-medium text-[var(--foreground)]">
                {step.quote}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
