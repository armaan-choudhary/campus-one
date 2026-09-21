'use client';

import React from 'react';
import Link from 'next/link';
import { CampusOneMark } from './CampusOneMark';

interface HomeFooterProps {
  currentTheme?: 'dark' | 'light';
}

export const HomeFooter: React.FC<HomeFooterProps> = () => {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-[var(--border-subtle)] py-10 px-4 sm:px-8 lg:px-12 text-xs font-mono text-[var(--text-secondary)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 flex items-center justify-center text-indigo-400">
            <CampusOneMark size={16} />
          </div>
          <span className="font-bold text-sm text-[var(--foreground)] tracking-tight">
            CampusOne
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
            BLDG 01
          </span>
        </div>

        {/* Minimal Nav */}
        <div className="flex flex-wrap items-center gap-6 text-[11px]">
          <a
            href="#campus-map"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Campus Services
          </a>
          <Link
            href="/workspace?role=student"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Ask Assistant
          </Link>
          <span className="text-[var(--border-medium)]">&bull;</span>
          <span className="text-[var(--text-tertiary)]">Privacy</span>
          <span className="text-[var(--text-tertiary)]">Accessibility</span>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-[var(--text-tertiary)]">
          &copy; {new Date().getFullYear()} CampusOne
        </div>
      </div>
    </footer>
  );
};
