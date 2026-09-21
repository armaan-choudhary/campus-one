'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PERSONAS } from '@/lib/demoFixtures';
import { CampusOneMark } from './CampusOneMark';

interface HomeNavbarProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth?: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  currentTheme,
  onToggleTheme,
  onOpenAuth,
}) => {
  const { user, role, isAuthenticated } = useAuth();
  const currentPersona = PERSONAS[role] || PERSONAS.student;

  return (
    <header className="h-14 bg-[var(--background)]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 border-b border-[var(--border-subtle)] transition-colors">
      {/* Left: Brand Identity with Wayfinding Motif */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 group py-1 cursor-pointer"
          aria-label="CampusOne Home"
        >
          <div className="w-5 h-5 flex items-center justify-center text-indigo-400 group-hover:text-[var(--foreground)] transition-colors">
            <CampusOneMark size={18} />
          </div>
          <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
            CampusOne
          </span>
        </Link>
        <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-tertiary)] border-l border-[var(--border-subtle)] pl-2.5 uppercase tracking-wider">
          BLDG 01 &bull; FRONT DOOR
        </span>
      </div>

      {/* Center: Campus Wayfinding Directory Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs text-[var(--text-secondary)] font-medium">
        <a
          href="#campus-map"
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Campus Directory
        </a>
        <a
          href="#how-it-works"
          className="hover:text-[var(--foreground)] transition-colors"
        >
          How It Works
        </a>
        <Link
          href="/workspace?role=student"
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Ask Assistant
        </Link>
      </nav>

      {/* Right Controls: Student ID + Theme + Primary Action */}
      <div className="flex items-center gap-2.5">
        {/* Student ID Wayfinding Pill */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-xs border border-[var(--border-subtle)] text-[var(--foreground)] transition-colors cursor-pointer"
          title="Campus Identity & Role-Based Access"
          aria-label="Manage campus identity"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {isAuthenticated ? (user?.displayName || currentPersona.name) : 'Student ID'}
          </span>
          {isAuthenticated && (
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] border-l border-[var(--border-subtle)] pl-1.5 hidden sm:inline">
              #88492
            </span>
          )}
        </button>

        {/* Quiet Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-1)] transition-colors cursor-pointer"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-200" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-900" />
          )}
        </button>

        {/* Primary Action */}
        <Link
          href="/workspace?role=student"
          className="flex items-center gap-1.5 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] text-xs font-semibold px-3.5 py-1.5 rounded transition-all cursor-pointer shadow-xs"
        >
          <span>Launch Portal</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
};
