'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TicketProvider, useTickets } from '@/context/TicketContext';
import { AdminTicketPanel } from '@/components/AdminTicketPanel';
import { CampusLoader } from '@/components/ui/CampusLoader';
import {
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Lock,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Inbox,
  AlertTriangle,
} from 'lucide-react';

function AdminNav({ currentTheme, onToggleTheme }: { currentTheme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const { tickets } = useTickets();
  const router = useRouter();

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-[var(--surface-1)]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[var(--border-subtle)] transition-colors">
      {/* Brand & Admin Badge */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group py-1 cursor-pointer">
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

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Console</span>
        </div>
      </div>

      {/* Center Operational Live Stats */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Queue Live</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
          <span>Pending: <strong className="text-amber-400">{pendingCount}</strong></span>
          <span>&bull;</span>
          <span>Claimed: <strong className="text-blue-400">{inProgressCount}</strong></span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Switch to Student Portal */}
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--foreground)] font-medium border border-[var(--border-subtle)] transition-all cursor-pointer"
          title="Open Student Portal"
        >
          <span>Student View</span>
          <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]" />
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] active:scale-95 transition-all cursor-pointer"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
            SA
          </div>
          <span className="hidden xl:inline text-xs font-mono text-[var(--text-secondary)]">
            {user?.email || 'admin@example.edu'}
          </span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
            title="Sign out of Admin Console"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function AdminAuthBarrier() {
  const { switchDemoPersona, login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.edu');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState<string | null>(null);

  const handleAdminQuickLogin = async () => {
    setError(null);
    try {
      await switchDemoPersona('admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate as admin');
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center items-center p-4 sm:p-6 text-[var(--foreground)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-2xl space-y-6">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            HTTP 403 &bull; Role Clearance Required
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Admin Console Access
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            This management console is restricted to university staff and administrators. Please authenticate with administrator credentials to manage student tickets.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-500">
            {error}
          </div>
        )}

        {/* 1-Click Fast Track for Demonstration */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span>Demonstration Access</span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              1-Click
            </span>
          </div>
          <button
            onClick={handleAdminQuickLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating...' : 'Sign in as Administrator (admin@example.edu)'}</span>
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="text-xs font-mono text-[var(--text-secondary)]">Or Sign In with Email</div>
          <div>
            <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.edu"
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--foreground)] font-mono focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--foreground)] font-mono focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Verifying...' : 'Sign In with Password'}</span>
          </button>
        </form>

        {/* Return to Student Portal Link */}
        <div className="pt-2 text-center">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminConsoleContent() {
  const { role, isAuthenticated, isLoading } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('campusone-theme', next);
      return next;
    });
  };

  if (isLoading) {
    return <CampusLoader fullscreen label="Verifying Administrator Session..." />;
  }

  // Role Gate: Only 'admin' role has access to this dedicated admin page
  if (!isAuthenticated || role !== 'admin') {
    return <AdminAuthBarrier />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden transition-colors duration-200">
      <AdminNav currentTheme={currentTheme} onToggleTheme={toggleTheme} />
      <main className="flex-1 flex overflow-hidden relative">
        <AdminTicketPanel />
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <TicketProvider>
      <AdminConsoleContent />
    </TicketProvider>
  );
}
