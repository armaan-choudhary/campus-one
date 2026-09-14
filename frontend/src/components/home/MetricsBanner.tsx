'use client';

import React from 'react';
import { CheckCircle2, Zap, Award, BookOpen, Clock } from 'lucide-react';

const METRICS = [
  {
    icon: Award,
    value: '88.4%',
    label: 'Golden Benchmark Accuracy',
    detail: 'Validated against 1,200 curated institutional ground-truth QA pairs.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Zap,
    value: '76.2%',
    label: 'Autonomous Resolution',
    detail: 'Inquiries resolved end-to-end without human agent intervention.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Clock,
    value: '<1.8s',
    label: 'Time-to-First-Token',
    detail: 'Streamed generation with multi-source hybrid vector retrieval.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: BookOpen,
    value: '100%',
    label: 'Citation Anchoring',
    detail: 'Every factual assertion backed by official university documentation.',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
];

export const MetricsBanner: React.FC = () => {
  return (
    <section id="telemetry" className="py-12 px-4 sm:px-8 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[var(--border-subtle)]/60 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1">
              Production Telemetry
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Enterprise SLAs &amp; Real-Time Precision
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Telemetry verified across all campus service tiers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="p-5 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 hover:-translate-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                    {metric.value}
                  </span>
                  <div className={`p-2 rounded-lg ${metric.bg}`}>
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                  {metric.label}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {metric.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
