'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface HomeFooterProps {
  currentTheme: 'dark' | 'light';
}

export const HomeFooter: React.FC<HomeFooterProps> = ({ currentTheme }) => {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-[var(--border-subtle)] py-12 px-4 sm:px-8 lg:px-12 text-xs text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[var(--border-subtle)]">
          {/* Brand & System Status */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 relative shrink-0">
                <Image
                  src={currentTheme === 'dark' ? '/logo.png' : '/logo-dark.png'}
                  alt="CampusOne Logo"
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-sm text-[var(--foreground)]">
                CampusOne
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                Enterprise v2.4
              </span>
            </div>

            <p className="max-w-sm text-xs leading-relaxed text-[var(--text-secondary)]">
              Unified conversational infrastructure connecting academic, administrative, IT, and residential life services for modern higher education.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[var(--foreground)] font-medium">All Knowledge Pipelines Operational</span>
              <span className="text-[var(--text-secondary)]">• 99.98% Uptime</span>
            </div>
          </div>

          {/* Quick Nav: Portals */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="font-semibold text-[var(--foreground)] uppercase tracking-wider text-[10px]">
              Role Portals
            </div>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/workspace?role=student"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
                >
                  Student Experience
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)]" />
                </Link>
              </li>
              <li>
                <Link
                  href="/workspace?role=agent"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
                >
                  Service Desk Triage
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)]" />
                </Link>
              </li>
              <li>
                <Link
                  href="/workspace?role=knowledge_admin"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
                >
                  Knowledge Mesh Admin
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)]" />
                </Link>
              </li>
              <li>
                <Link
                  href="/workspace?role=executive"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
                >
                  Executive SLA Dashboard
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Compliance */}
          <div className="md:col-span-4 space-y-2.5">
            <div className="font-semibold text-[var(--foreground)] uppercase tracking-wider text-[10px]">
              Architecture &amp; Governance
            </div>
            <div className="space-y-1.5 leading-relaxed text-[11px]">
              <p>
                <span className="text-[var(--foreground)] font-medium">Stack:</span> Next.js 16 App Router, React 19, TypeScript, Azure AI Foundry, Hybrid Sparse/Dense Vector Retrieval.
              </p>
              <p>
                <span className="text-[var(--foreground)] font-medium">Compliance:</span> Designed for FERPA, Title IX privacy requirements, and zero data-retention vector embeddings.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)]">
          <div>
            &copy; {new Date().getFullYear()} CampusOne Systems. University Operations Platform.
          </div>
          <div className="flex items-center gap-4">
            <span>Institutional Use Only</span>
            <span>•</span>
            <span>Version 2.4.0-prod</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
