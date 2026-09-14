'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Lock, Compass } from 'lucide-react';
import { KnowledgeMeshHero } from '@/components/vectors/KnowledgeMeshHero';

const SAMPLE_INQUIRIES = [
  { label: 'Academic Appeal Process', query: 'How do I submit an academic grade appeal for last semester?' },
  { label: '1098-T Tax Documents', query: 'Where do I find my 1098-T tuition tax statement?' },
  { label: 'Dorm Room Change Request', query: 'Can I request a room transfer for the spring semester?' },
  { label: 'Campus VPN Configuration', query: 'How do I configure GlobalProtect VPN on macOS?' },
];

export const HomeHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 px-4 sm:px-8 lg:px-12 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--surface-1)] to-[var(--background)]">
      {/* Ambient background blur elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Copy, CTAs, Sample Inquiries */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-[var(--foreground)]">CampusOne Intelligent Gateway</span>
            <span className="text-[var(--text-secondary)]">| Zero Hallucination RAG</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)] leading-[1.15]">
            One Intelligent Gateway for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500">
              All Campus Services
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            CampusOne unites Registrar, Financial Aid, IT Services, and Residential Life into a single verified conversational mesh. Every response is anchored in official university policy with traceable citations and automated tier-2 human escalation.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/workspace?role=student"
              className="flex items-center gap-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] px-5 py-3 rounded-full text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-150 group cursor-pointer"
            >
              <span>Student Experience</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/workspace?role=agent"
              className="flex items-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] px-5 py-3 rounded-full text-sm font-semibold shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <span>Staff &amp; Agent Queue</span>
            </Link>
          </div>

          {/* Quick interactive inquiry prompts */}
          <div className="w-full pt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Try standard institutional inquiries:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_INQUIRIES.map((item) => (
                <Link
                  key={item.label}
                  href={`/workspace?role=student`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-2)]/80 hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors duration-150 cursor-pointer"
                >
                  &ldquo;{item.label}&rdquo;
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance & Trust badges */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)]/60 w-full">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>FERPA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Granular RBAC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>&lt;1.8s Sub-Second TTFT</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Vector Illustration & Floating Cards */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="w-full max-w-md aspect-square relative rounded-2xl p-4 bg-[var(--surface-1)]/60 border border-[var(--border-subtle)] shadow-xl backdrop-blur-xs flex items-center justify-center overflow-hidden">
            <div className="w-full h-full">
              <KnowledgeMeshHero />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
