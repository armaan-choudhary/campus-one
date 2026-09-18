'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  FileText,
  Download,
  Search,
  Sparkles,
  Layers,
  Send,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PERSONAS } from '@/lib/demoFixtures';
import { InteractiveSubtleBackground } from './InteractiveSubtleBackground';

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

export const HomeHero: React.FC<HomeHeroProps> = ({ currentTheme, onOpenAuth }) => {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, role } = useAuth();
  const activePersona = PERSONAS[role] || PERSONAS.student;

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
      className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 px-4 sm:px-8 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--background)] overflow-hidden"
    >
      {/* Subtle interactive geometric background */}
      <InteractiveSubtleBackground
        containerRef={sectionRef}
        currentTheme={currentTheme}
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col space-y-12">
        {/* Top Header: Student-Centric Editorial Headline & Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* Headline & Value Proposition */}
          <div className="lg:col-span-8 flex flex-col items-start space-y-5">
            {/* Student Guide Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="uppercase font-medium">Campus Student Assistant</span>
              <span className="text-[var(--border-medium)]">/</span>
              <span>Single Front Door For Everything</span>
            </div>

            {/* Headline - Inter Bold + Playfair Display Italic Serif, ZERO gradients */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-[-0.03em] font-normal leading-[1.08] text-[var(--foreground)]">
              <span className="font-sans font-bold">One place for every</span> <br />
              <span className="font-serif italic font-normal text-[var(--foreground)] tracking-normal text-5xl sm:text-6xl lg:text-7xl block pt-1.5 pb-1">
                campus question.
              </span>
            </h1>

            {/* Subtext - direct, student focused */}
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Never bounce between the Registrar, Bursar, Housing, and Advising again. Ask once, get official answers cited from university handbooks, and download the exact forms you need.
            </p>
          </div>

          {/* Student CTA, Auth Trigger & Trust Proof */}
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/workspace?role=student"
                className="inline-flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer shadow-xs"
              >
                <span>Ask Campus Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border-subtle)] active:scale-[0.98] px-3.5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer"
                title="Manage Campus Identity & RBAC"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Campus ID</span>
              </button>
            </div>

            {/* Student-Relevant Reassurances */}
            <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)] pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                2025–26 Handbooks
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                Official Forms
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Free 24/7
              </span>
            </div>
          </div>
        </div>

        {/* Real Product UI Screen: Live Conversational Assistant Stream */}
        <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-xs overflow-hidden">
          {/* Chat Window Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--surface-2)]/50">
            {/* Window Controls & Student Identifier (Interactive Auth link) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                campusone_assistant
              </span>
              <span className="text-[var(--border-medium)]">&bull;</span>
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-xs font-mono text-[var(--foreground)] hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Click to view or switch authenticated campus identity"
              >
                <span>{user?.displayName || activePersona.name}</span>
                <span className="text-[var(--text-secondary)]">({activePersona.badge})</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </button>
            </div>

            {/* Live Policy Grounding Status */}
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Multi-Department Policy Mesh Active</span>
              <Link
                href="/workspace?role=student"
                className="text-[var(--foreground)] hover:underline inline-flex items-center gap-1 font-medium ml-2"
              >
                <span>Open Fullscreen</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Chat Stream Body */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[var(--background)] space-y-6">
            {/* 1. Student Message: Complex multi-department inquiry */}
            <div className="flex items-start justify-end gap-3">
              <div className="max-w-2xl rounded-lg p-4 bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--foreground)] space-y-1">
                <div className="text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  {user?.displayName || activePersona.name} &bull; Student ID #88492
                </div>
                <p className="leading-relaxed font-medium">
                  &ldquo;I had an emergency appendectomy last week and missed my CS midterm. My professor told me to check with the Dean, but my financial aid disbursement is also frozen because I dropped below 12 credits while hospitalized. What do I actually do?&rdquo;
                </p>
              </div>
              <div className="w-8 h-8 rounded-md bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                {activePersona.avatar}
              </div>
            </div>

            {/* Cross-Department Orchestration Pill (Illustrates unified routing) */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[var(--text-secondary)] py-0.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cross-Department Orchestration: Registrar (Academic Code §7.2) + Bursar (Financial Aid Title IV)</span>
            </div>

            {/* 2. Unified CampusOne Assistant Response */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                C1
              </div>
              <div className="flex-1 max-w-3xl rounded-lg p-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
                {/* Resolution Badge */}
                <div className="flex items-center justify-between text-xs border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Unified Policy Resolution
                  </span>
                  <span className="font-mono text-[var(--text-secondary)] text-[11px]">
                    Zero Departmental Bouncing
                  </span>
                </div>

                {/* Explanation */}
                <div className="text-sm text-[var(--foreground)] leading-relaxed space-y-3">
                  <p>
                    You don&rsquo;t need to visit multiple offices. Here is the exact procedure to resolve both your midterm and financial aid hold under official university policy:
                  </p>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-1">
                      <div className="font-bold text-[var(--foreground)]">1. Academic Midterm Makeup (§7.2)</div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        Under Academic Regulations §7.2, medical hospitalization qualifies for an automatic excused absence. Faculty Senate Code §3.2 requires professors to provide an equitable makeup exam date or weight adjustment within 14 days of discharge.
                      </p>
                    </div>

                    <div className="p-3 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-1">
                      <div className="font-bold text-[var(--foreground)]">2. Financial Aid Disbursement Protection (§4.1)</div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        Filing your medical documentation places an immediate 30-day Title IV Medical Hold on your student account. This prevents tuition de-registration and keeps your financial aid grant active while your petition is reviewed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verifiable Official Citations */}
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                  <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
                    Verifiable Official Policy Citations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--foreground)]">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Academic Regulations Handbook §7.2 (Medical Appeals)</span>
                      <span className="text-[var(--text-secondary)]">&bull; Page 18</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--foreground)]">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Student Financial Services §4.1 (Medical Aid Hold)</span>
                      <span className="text-[var(--text-secondary)]">&bull; Page 32</span>
                    </div>
                  </div>
                </div>

                {/* Action Checklist & Form Links */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/workspace?role=student&q=Download%20Medical%20Petition%20Form%20104-A"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] font-mono text-[11px] text-[var(--foreground)] cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Form 104-A (PDF)</span>
                    </Link>

                    <Link
                      href="/workspace?role=student&q=How%20do%20I%20request%20a%20medical%20hold%20on%20my%20financial%20aid%3F"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] font-mono text-[11px] text-[var(--foreground)] cursor-pointer transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Apply Financial Aid Freeze</span>
                    </Link>
                  </div>

                  <Link
                    href="/workspace?role=student&q=I%20had%20an%20emergency%20appendectomy%20and%20need%20to%20resolve%20my%20midterm%20and%20aid"
                    className="font-medium text-[var(--foreground)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ask follow-up in live chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Question Input Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 p-3 bg-[var(--surface-2)]/60 border-t border-[var(--border-subtle)]"
          >
            <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask any campus question in plain English (e.g. 'Can I take a class pass/fail?' or 'Parking citation appeal')..."
              className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[var(--foreground)] text-[var(--background)] text-xs font-medium rounded-md hover:opacity-90 active:scale-[0.98] transition-all shrink-0 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Real Student Sample Questions */}
          <div className="px-4 sm:px-6 py-2.5 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">Try asking:</span>
            {SAMPLE_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(question)}
                className="px-2.5 py-1 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--foreground)] transition-colors cursor-pointer text-left"
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
