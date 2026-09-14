'use client';

import React from 'react';
import {
  Laptop,
  GraduationCap,
  CreditCard,
  Home,
  ShieldCheck,
  HelpCircle,
  Users,
  Compass,
} from 'lucide-react';
import { RoutingFlowVector } from '@/components/vectors/RoutingFlowVector';

const DOMAINS = [
  {
    icon: Laptop,
    name: 'IT & Computing Services',
    desc: 'Self-service MFA reset, SSO tokens, software licenses, campus WiFi troubleshooting.',
    sample: 'Configure GlobalProtect VPN',
    confidence: 0.96,
  },
  {
    icon: GraduationCap,
    name: 'Registrar & Academics',
    desc: 'Transcript fulfillment, course add/drop deadlines, major change audits, grade appeals.',
    sample: 'Add/drop deadlines for Spring',
    confidence: 0.94,
  },
  {
    icon: CreditCard,
    name: 'Bursar & Financial Aid',
    desc: 'FAFSA disbursement schedules, installment billing plans, 1098-T tax statements.',
    sample: 'Tuition payment plans',
    confidence: 0.92,
  },
  {
    icon: Home,
    name: 'Housing & Residential Life',
    desc: 'Dorm room swap requests, emergency maintenance, move-in logistics, meal plan points.',
    sample: 'Emergency dorm maintenance',
    confidence: 0.95,
  },
];

const ARCH_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Zero-Hallucination RAG',
    desc: 'Every factual assertion is grounded in indexed university policy documents with strict similarity thresholds. Unsupported claims are suppressed automatically.',
  },
  {
    icon: HelpCircle,
    title: 'Dynamic Intent Clarification',
    desc: 'When queries are broad or cross departmental boundaries, the system presents tailored options before dispatching to eliminate ambiguity.',
  },
  {
    icon: Users,
    title: 'Automated Tier-2 Escalation',
    desc: 'Seamless human triage handoff when sentiment drops, confidence falls below 80%, or when the inquiry requires administrative credentials.',
  },
];

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="py-16 lg:py-24 px-4 sm:px-8 lg:px-12 bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Cross-Departmental Orchestration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--foreground)]">
            Bridging Siloed Campus Knowledge
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
            Traditional campus operations force students to guess which office handles their issue. CampusOne classifies, routes, and solves across departments simultaneously.
          </p>
        </div>

        {/* 4 Domain Cards with Routing Vectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
            return (
              <div
                key={domain.name}
                className="p-6 rounded-2xl bg-[var(--surface-2)]/50 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--surface-1)] text-indigo-500 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--foreground)]">
                      {domain.name}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  {domain.desc}
                </p>

                {/* Animated vector flow demonstration */}
                <div className="pt-3 border-t border-[var(--border-subtle)]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                    Sample: &ldquo;{domain.sample}&rdquo;
                  </div>
                  <RoutingFlowVector domainLabel={domain.name.split(' ')[0]} confidence={domain.confidence} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Pillars of Reliability */}
        <div id="architecture" className="pt-8 border-t border-[var(--border-subtle)]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              Engineered for Institutional Trust
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Guaranteed accuracy and transparent citation provenance at every conversational turn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARCH_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 rounded-2xl bg-[var(--surface-2)]/30 border border-[var(--border-subtle)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--foreground)] mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
