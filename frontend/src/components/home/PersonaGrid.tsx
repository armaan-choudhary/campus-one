'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Headphones,
  Database,
  BarChart3,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '@/types';

interface PersonaCardProps {
  role: UserRole;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  capabilities: string[];
  ctaText: string;
}

const PERSONA_CARDS: PersonaCardProps[] = [
  {
    role: 'student',
    title: 'Student & Faculty Front Door',
    badge: 'Student Experience',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    icon: GraduationCap,
    description:
      'A singular conversational gateway for degree audits, financial aid deadlines, IT credentials, and dorm maintenance.',
    capabilities: [
      'Multi-domain context routing',
      'Policy-anchored source citations',
      'Adaptive clarification questions',
      'One-tap tier-2 staff escalation',
    ],
    ctaText: 'Enter Student Portal',
  },
  {
    role: 'agent',
    title: 'Service Desk Triage Desk',
    badge: 'Tier-2 Staff Operations',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: Headphones,
    description:
      'Real-time ticket queue for human support specialists with AI confidence scoring, full conversation history, and quick resolution templates.',
    capabilities: [
      'Real-time incoming escalation triage',
      'AI confidence & sentiment telemetry',
      'One-click ticket takeover & resolution',
      'Internal audit audit-trail logging',
    ],
    ctaText: 'Open Agent Queue',
  },
  {
    role: 'knowledge_admin',
    title: 'Knowledge Mesh Management',
    badge: 'Ingestion & Hygiene',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    icon: Database,
    description:
      'Manage policy ingestion, vector embeddings, chunk synchronization, and knowledge source health across all university departments.',
    capabilities: [
      'Multi-source document indexing',
      'Chunk freshness & drift detection',
      'Automated semantic vector re-indexing',
      'Orphaned policy link monitoring',
    ],
    ctaText: 'Manage Knowledge Mesh',
  },
  {
    role: 'executive',
    title: 'Institutional Analytics & SLA',
    badge: 'Executive Leadership',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: BarChart3,
    description:
      'High-level metrics for campus CIOs and Provosts: inquiry volume trends, containment rates, department heatmaps, and staffing ROI.',
    capabilities: [
      'Departmental load breakdown',
      'Deflection & resolution rate KPIs',
      'Sub-second latency percentiles (p50/p99)',
      'Quarterly cost-saving projections',
    ],
    ctaText: 'View Executive Dashboard',
  },
];

export const PersonaGrid: React.FC = () => {
  return (
    <section id="personas" className="py-16 lg:py-24 px-4 sm:px-8 lg:px-12 bg-[var(--background)] border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Persona-Tailored Workspaces</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--foreground)]">
            Tailored Experiences for Every Campus Role
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
            CampusOne provides purpose-built interfaces tailored to students, service desk agents, knowledge managers, and executive leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PERSONA_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.role}
                className="flex flex-col justify-between p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-indigo-500/40 hover:shadow-xl transition-all duration-200 group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
                    {card.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    {card.description}
                  </p>

                  <div className="space-y-1.5 mb-6">
                    {card.capabilities.map((cap) => (
                      <div key={cap} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/workspace?role=${card.role}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--accent)] text-[var(--foreground)] hover:text-[var(--accent-foreground)] border border-[var(--border-subtle)] hover:border-transparent transition-all duration-150 group/btn cursor-pointer"
                >
                  <span>{card.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
