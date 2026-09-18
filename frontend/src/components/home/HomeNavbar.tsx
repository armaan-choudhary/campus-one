'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sun, Moon, ArrowRight, Sparkles, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PERSONAS } from '@/lib/demoFixtures';

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
    <header className="h-14 bg-[var(--surface-1)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 border-b border-[var(--border-subtle)] transition-colors">
      {/* Left: Brand Identity */}
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
      </div>

      {/* Center: Minimalist Anchor Navigation */}
      <nav className="hidden md:flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium">
        <a
          href="#capabilities"
          className="px-3 py-1.5 rounded-md hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/70 transition-all duration-150"
        >
          Campus Services
        </a>
        <Link
          href="/workspace?role=student"
          className="px-3 py-1.5 rounded-md hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/70 transition-all duration-150"
        >
          Ask Assistant
        </Link>
      </nav>

      {/* Right Controls: Auth Trigger, Theme Toggle & Launch Portal */}
      <div className="flex items-center gap-2">
        {/* Campus Identity & RBAC Trigger Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)]/80 hover:bg-[var(--surface-3)] text-xs border border-[var(--border-subtle)] text-[var(--foreground)] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs group"
          title="Campus Identity & Role-Based Access"
          aria-label="Manage campus identity"
        >
          {isAuthenticated ? (
            <>
              <div className="w-5 h-5 rounded-full bg-[var(--foreground)] text-[var(--background)] font-semibold text-[10px] flex items-center justify-center shrink-0">
                {currentPersona.avatar}
              </div>
              <span className="hidden sm:inline text-xs font-medium max-w-[110px] truncate">
                {user?.displayName || currentPersona.name}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-subtle)] hidden lg:inline">
                {currentPersona.badge}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </>
          ) : (
            <>
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campus Sign In</span>
            </>
          )}
        </button>

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
