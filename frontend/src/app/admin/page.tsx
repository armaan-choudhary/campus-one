'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TicketProvider, useTickets } from '@/context/TicketContext';
import { AdminTicketPanel } from '@/components/AdminTicketPanel';
import { AdminAnalyticsPanel } from '@/components/AdminAnalyticsPanel';
import { CampusLoader } from '@/components/ui/CampusLoader';
import { CampusOneMark } from '@/components/home/CampusOneMark';
import { OrangeTicks } from '@/components/home/HandwrittenElements';
import {
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  KeyRound,
  ArrowLeft,
  Activity,
  Inbox,
} from 'lucide-react';

interface AdminNavProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab: 'tickets' | 'analytics';
  onSelectTab: (tab: 'tickets' | 'analytics') => void;
}

function AdminNav({ currentTheme, onToggleTheme, activeTab, onSelectTab }: AdminNavProps) {
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
    <header className="h-14 bg-[#0E0E0E]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[#1C1C1F] text-white transition-colors">
      {/* Brand & Admin Badge */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group py-1 cursor-pointer">
          <div className="w-5 h-5 flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <CampusOneMark size={18} />
          </div>
          <span className="font-sans font-bold text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            CampusOne
          </span>
        </Link>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1E26] border border-[#3F4350] text-xs font-mono font-medium">
          <span className="w-0.5 h-2.5 bg-[#38BDF8] rounded-full inline-block" />
          <span>Admin Console</span>
        </div>
      </div>

      {/* Center Navigation Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-[#14151B] border border-[#23242A]">
        <button
          onClick={() => onSelectTab('tickets')}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-[#22242D] text-white shadow-xs border border-[#3A3D4A]'
              : 'text-[#8E8F94] hover:text-white hover:bg-[#1A1C22]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 text-amber-400" />
          <span>Ticket Triage</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#22242D] text-white shadow-xs border border-[#3A3D4A]'
              : 'text-[#8E8F94] hover:text-white hover:bg-[#1A1C22]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>Telemetry & Analytics</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Live
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Switch to Student Portal */}
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1E26] hover:bg-[#272932] text-xs text-white font-medium border border-[#3F4350] transition-all cursor-pointer shadow-xs"
          title="Open Student Portal"
        >
          <span>Student View</span>
          <ExternalLink className="w-3 h-3 text-[#8E8F94]" />
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8F94] hover:text-white hover:bg-[#16171D] active:scale-95 transition-all cursor-pointer"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#23242A]">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-[#3F4350] flex items-center justify-center shrink-0 relative">
            <Image
              src="/illustrations/wimpy/avatar-4.png"
              alt="Admin Avatar"
              fill
              sizes="28px"
              className="object-contain"
            />
          </div>
          <span className="hidden xl:inline text-xs font-mono text-zinc-300">
            {user?.email || 'admin@example.edu'}
          </span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8F94] hover:text-rose-400 hover:bg-[#1C1E26] active:scale-95 transition-all cursor-pointer"
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
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col justify-center items-center p-4 sm:p-6 text-white">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#121316] border border-[#23242A] shadow-2xl space-y-6">
        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#1C1E26] border border-[#282A33] text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#8E8F94] uppercase mb-1">
            <span className="text-[#F97316] font-bold text-sm">—</span>
            <span>HTTP 403 • ROLE CLEARANCE</span>
            <OrangeTicks count={2} />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            Staff triage <br />
            <span className="italic font-normal">clearance required</span>.
          </h1>
          <p className="text-xs text-[#8E8F94] leading-relaxed">
            This management console is restricted to university staff and administrators. Please authenticate with administrator credentials to manage student tickets.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 text-center">
            {error}
          </div>
        )}

        {/* 1-Click Fast Track for Demonstration */}
        <div className="p-4 rounded-xl bg-[#18191E] border border-[#282A33] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8E8F94]">
            <span>Demonstration Access</span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              1-Click
            </span>
          </div>
          <button
            onClick={handleAdminQuickLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0E0E0E] hover:bg-zinc-200 font-semibold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating...' : 'Sign in as Administrator (admin@example.edu)'}</span>
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3 pt-2 border-t border-[#23242A]">
          <div className="text-xs font-mono text-[#8E8F94]">Or Sign In with Email</div>
          <div>
            <label className="block text-[11px] font-mono text-[#8E8F94] mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.edu"
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#1A1C22] border border-[#282A33] text-white font-mono focus:outline-hidden focus:border-[#3F4350]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-[#8E8F94] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#1A1C22] border border-[#282A33] text-white font-mono focus:outline-hidden focus:border-[#3F4350]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#272932] hover:bg-[#343743] text-white border border-[#3F4350] text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Verifying...' : 'Sign In with Password'}</span>
          </button>
        </form>

        {/* Return to Student Portal Link */}
        <div className="pt-1 text-center">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 text-xs text-[#8E8F94] hover:text-white transition-colors cursor-pointer"
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

  const [activeTab, setActiveTab] = useState<'tickets' | 'analytics'>('tickets');

  return (
    <div className="flex flex-col h-screen w-full bg-[#0E0E0E] text-white overflow-hidden transition-colors duration-200">
      <AdminNav
        currentTheme={currentTheme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'tickets' ? <AdminTicketPanel /> : <AdminAnalyticsPanel />}
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

