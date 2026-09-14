'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sun, Moon, ArrowRight, Sparkles } from 'lucide-react';

interface HomeNavbarProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  currentTheme,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 bg-[var(--surface-1)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 border-b border-[var(--border-subtle)] transition-colors">
      {/* Left: Brand Identity & Version Tag */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 group py-1 cursor-pointer"
          aria-label="CampusOne Home"
        >
          <div className="w-6 h-6 relative shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Image
              src={currentTheme === 'dark' ? '/logo.png' : '/logo-dark.png'}
              alt="CampusOne Logo"
              fill
              sizes="24px"
              className="object-contain"
              priority
            />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--foreground)] group-hover:text-indigo-500 transition-colors">
            CampusOne
          </span>
        </Link>

        <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] px-2 py-0.5 rounded-md bg-[var(--surface-2)]/60 border border-[var(--border-subtle)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>v2.4 Enterprise</span>
        </div>
      </div>

      {/* Center: Minimalist Anchor Navigation */}
      <nav className="hidden md:flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium">
        <a
          href="#capabilities"
          className="px-3 py-1.5 rounded-md hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/70 transition-all duration-150"
        >
          Capabilities
        </a>
        <a
          href="#personas"
          className="px-3 py-1.5 rounded-md hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/70 transition-all duration-150"
        >
          Workspaces
        </a>
        <a
          href="#telemetry"
          className="px-3 py-1.5 rounded-md hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/70 transition-all duration-150"
        >
          Telemetry
        </a>
        <a
          href="#architecture"
          className="px-3 py-1.5 rounded-md hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/70 transition-all duration-150"
        >
          Architecture
        </a>
      </nav>

      {/* Right Controls: Theme Toggle & Launch Portal */}
      <div className="flex items-center gap-2">
        {/* Compact Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] active:scale-95 transition-all duration-150 border border-transparent hover:border-[var(--border-subtle)] cursor-pointer group"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 transition-transform duration-200 group-hover:-rotate-12" />
          )}
        </button>

        {/* Minimalist Launch CTA */}
        <Link
          href="/workspace?role=student"
          className="flex items-center gap-1.5 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-95 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all duration-150 shadow-xs group cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Launch Portal</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </header>
  );
};
