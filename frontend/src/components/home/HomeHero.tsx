'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Download,
  Search,
  Send,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { InteractiveSubtleBackground } from './InteractiveSubtleBackground';
import { CampusOneMark } from './CampusOneMark';

interface HomeHeroProps {
  currentTheme?: 'dark' | 'light';
  onOpenAuth?: () => void;
}

const SAMPLE_QUESTIONS = [
  'Can I switch a class to Pass/Fail after week 6?',
  'I have 3 final exams in one day. Can I reschedule?',
  'How do I appeal an unexpected financial aid hold?',
  'Can I swap dorm rooms mid-semester with another student?',
];

export const HomeHero: React.FC<HomeHeroProps> = ({ currentTheme }) => {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/workspace?role=student&q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/workspace?role=student');
    }
  };

  const handleSampleClick = (question: string) => {
    router.push(`/workspace?role=student&q=${encodeURIComponent(question)}`);
  };

  return (
    <section
      ref={sectionRef}
      className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 px-4 sm:px-8 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--background)] overflow-hidden"
    >
      {/* Texture-only subtle grid background */}
      <InteractiveSubtleBackground
        containerRef={sectionRef}
        currentTheme={currentTheme}
      />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col space-y-16">
        {/* Hero Header: Architectural Wayfinding & Massive Typography */}
        <div className="max-w-3xl flex flex-col items-start space-y-6">
          {/* Wayfinding System Header + Playful Human Detail */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--foreground)]">
              <CampusOneMark size={13} className="text-indigo-400" />
              <span className="font-bold tracking-wider">CAMPUSONE</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="text-[var(--text-secondary)]">FRONT DOOR / BUILDING 01</span>
            </div>

            <div className="text-[11px] text-[var(--text-tertiary)]">
              <span className="text-[var(--foreground)] font-medium">Wrong office?</span>{' '}
              <span>Not your problem.</span>
            </div>
          </div>

          {/* Headline: Grotesk + Editorial Serif (Only on campus question) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--foreground)] leading-[1.05]">
            One place for every <br />
            <span className="font-serif italic font-normal text-[var(--foreground)] block pt-1.5 pb-0.5">
              campus question.
            </span>
          </h1>

          {/* The Single Supporting Sentence */}
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
            Ask normally. We&rsquo;ll figure out which office needs to handle it.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/workspace?role=student"
              className="inline-flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] px-5 py-2.5 rounded text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span>Ask CampusOne</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#campus-map"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded text-sm font-medium text-[var(--foreground)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              <span>See how it works</span>
            </a>
          </div>
        </div>

        {/* Compact, Highly Visual Product Demo */}
        <div className="w-full rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden shadow-xs font-mono">
          {/* Wayfinding Top Bar */}
          <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs bg-[var(--surface-2)]/50">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>DISPATCH &bull; STUDENT INQUIRY #88492</span>
            </div>

            <Link
              href="/workspace?role=student"
              className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--foreground)] inline-flex items-center gap-1 transition-colors"
            >
              <span>Live Console</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-5 sm:p-7 bg-[var(--background)] space-y-6">
            {/* Student Inquiry */}
            <div className="space-y-1">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                Student Question &bull; Maya Lin
              </div>
              <div className="p-3.5 rounded bg-[var(--surface-1)] border border-[var(--border-subtle)] text-xs sm:text-sm font-sans font-medium text-[var(--foreground)]">
                &ldquo;I missed my midterm after being hospitalized. What can I do?&rdquo;
              </div>
            </div>

            {/* Visual Wayfinding Routing Schematic */}
            <div className="flex flex-col items-center py-1">
              <div className="w-px h-3 bg-[var(--border-medium)]" />

              {/* CampusOne Hub */}
              <div className="px-3.5 py-1.5 rounded bg-[var(--surface-2)] border border-indigo-500/40 text-[11px] text-[var(--foreground)] font-semibold flex items-center gap-2 shadow-xs">
                <CampusOneMark size={13} className="text-indigo-400" />
                <span>CampusOne Dispatch</span>
              </div>

              {/* Wayfinding Routes Fork */}
              <div className="w-full max-w-md my-2">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Route 1: Registrar */}
                  <div className="p-2.5 rounded border border-blue-500/50 bg-blue-500/[0.03] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-blue-400 font-bold">
                      <span>&rarr; REGISTRAR</span>
                      <span className="text-[9px] text-[var(--text-tertiary)]">BLDG 04</span>
                    </div>
                    <div className="text-[11px] font-sans text-[var(--foreground)]">
                      Academic Regulations &sect;7.2
                    </div>
                  </div>

                  {/* Route 2: Bursar */}
                  <div className="p-2.5 rounded border border-amber-500/50 bg-amber-500/[0.03] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                      <span>&rarr; BURSAR</span>
                      <span className="text-[9px] text-[var(--text-tertiary)]">BLDG 04</span>
                    </div>
                    <div className="text-[11px] font-sans text-[var(--foreground)]">
                      Financial Aid Title IV &sect;4.1
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-px h-3 bg-[var(--border-medium)]" />

              {/* Magic Count Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)]">
                <span className="text-blue-400 font-bold">2 offices involved</span>
                <span>&bull;</span>
                <span className="text-amber-400 font-bold">3 official policies</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-bold">1 unified answer</span>
              </div>

              <div className="w-px h-3 bg-[var(--border-medium)]" />
            </div>

            {/* Concise One Answer */}
            <div className="p-4 sm:p-5 rounded bg-[var(--surface-1)] border border-emerald-500/30 space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>One Unified Resolution</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  RESOLVED IN ONE TURN
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-[var(--foreground)]">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-blue-400 font-medium">Registrar:</strong> Hospitalization qualifies for an excused absence under &sect;7.2. Your instructor must provide an equitable makeup exam date within 14 days of discharge.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-amber-400 font-medium">Bursar:</strong> Submitting verification places an automatic 30-day Title IV Medical Hold on your account, protecting your financial aid disbursement.
                  </p>
                </div>
              </div>

              {/* Direct Form Receipt Link */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-t border-[var(--border-subtle)]">
                <Link
                  href="/workspace?role=student&q=Download%20Medical%20Petition%20Form%20104-A"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] text-[11px] text-[var(--foreground)] transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Download Form 104-A (PDF)</span>
                </Link>

                <Link
                  href="/workspace?role=student&q=I%20missed%20my%20midterm%20after%20being%20hospitalized.%20What%20can%20I%20do%3F"
                  className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Continue in live console &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 p-3 bg-[var(--surface-2)]/60 border-t border-[var(--border-subtle)] font-sans"
          >
            <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask any campus question (e.g., 'appeal parking citation' or 'drop deadline')..."
              className="w-full bg-transparent text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[var(--foreground)] text-[var(--background)] text-xs font-medium rounded hover:opacity-90 active:scale-[0.98] transition-all shrink-0 cursor-pointer inline-flex items-center gap-1"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Quick Prompts */}
          <div className="px-4 sm:px-6 py-2 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)]">Try:</span>
            {SAMPLE_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(question)}
                className="px-2 py-0.5 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-left"
              >
                &ldquo;{question}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
