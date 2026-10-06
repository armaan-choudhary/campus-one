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
import {
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  ArrowLeft,
  Inbox,
  Activity,
  ArrowRight,
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-[#0B0B0B] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[#292929] text-[#F5F3ED] transition-colors select-none">
      {/* Brand & Badge matching TopNav */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 group py-1 cursor-pointer"
          title="Return to CampusOne Homepage"
        >
          <div className="w-4.5 h-4.5 flex items-center justify-center text-[#F5F3ED] transition-transform group-hover:scale-105">
            <CampusOneMark size={16} />
          </div>
          <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#F5F3ED]">
            CampusOne
          </span>
          <span className="text-[#292929] text-xs font-mono hidden sm:inline">/</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#8D8A83] hidden sm:inline">
            Staff &amp; Admin
          </span>
        </Link>
      </div>

      {/* Center Navigation Switcher matching TopNav style */}
      <nav className="hidden sm:flex items-center gap-7 text-xs font-mono ml-4">
        <button
          onClick={() => onSelectTab('tickets')}
          className={`relative py-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'text-[#F5F3ED] font-semibold'
              : 'text-[#8D8A83] hover:text-[#F5F3ED]'
          }`}
        >
          <span>Ticket Triage</span>
          {pendingCount > 0 && (
            <span className="text-[10px] text-[#FF7A00] font-mono font-bold">
              [{pendingCount}]
            </span>
          )}
          {activeTab === 'tickets' && (
            <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#FF7A00]" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`relative py-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'text-[#F5F3ED] font-semibold'
              : 'text-[#8D8A83] hover:text-[#F5F3ED]'
          }`}
        >
          <span>Telemetry &amp; Analytics</span>
          {activeTab === 'analytics' && (
            <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#FF7A00]" />
          )}
        </button>

        <Link
          href="/workspace"
          className="relative py-1 text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer flex items-center gap-1"
          title="Open Student Assistant Workspace"
        >
          <span>Student Assistant</span>
          <ExternalLink className="w-3 h-3 text-[#8D8A83]" />
        </Link>
      </nav>

      {/* Right Controls matching TopNav */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-7 h-7 rounded flex items-center justify-center text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#151515] transition-colors cursor-pointer"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </button>

        {/* User Identity Chip: Name + Title + Avatar */}
        <div className="flex items-center gap-2.5 text-right pl-2 border-l border-[#292929]">
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-xs font-medium text-[#F5F3ED]">
              {user?.displayName || 'System Administrator'}
            </span>
            <span className="text-[10px] text-[#8D8A83] font-mono">
              Central Administration
            </span>
          </div>

          <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-[#292929] flex items-center justify-center shrink-0 relative">
            <Image
              src="/illustrations/wimpy/avatar-4.png"
              alt="Admin Avatar"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>

          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded flex items-center justify-center text-[#8D8A83] hover:text-rose-400 hover:bg-[#151515] transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col justify-center items-center p-4 sm:p-6 text-[#F5F3ED] relative overflow-hidden">
      {/* Subtle ambient warm backlight */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(255,122,0,0.06),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#121317]/90 border border-[#22232B] shadow-2xl space-y-6 relative z-10">
        {/* Shield Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#16171E] border border-[#242531] text-[#FF7A00] flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)] animate-pulse" />
            <span className="text-[#FF7A00] font-semibold">Staff Clearance Required</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#F5F3ED] tracking-tight">
            Staff Authentication Required<span className="text-[#FF7A00]">.</span>
          </h1>
          <p className="text-xs text-[#8D8A83] leading-relaxed font-sans pt-1">
            This management console is restricted to university staff and administrators. Please authenticate with administrator credentials to manage student tickets.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 text-center">
            {error}
          </div>
        )}

        {/* 1-Click Fast Track for Demonstration */}
        <div className="p-4 rounded-xl bg-[#0E0F13] border border-[#22232B] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8D8A83]">
            <span>Fast-Track Clearance</span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              1-Click
            </span>
          </div>
          <button
            onClick={handleAdminQuickLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FF7A00] text-black hover:bg-[#FF8A1F] font-bold text-xs shadow-[0_0_12px_rgba(255,122,0,0.35)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-mono"
          >
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>{isLoading ? 'Authenticating...' : 'Sign in as Administrator'}</span>
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3 pt-2 border-t border-[#1E1E24]">
          <div className="text-xs font-mono text-[#8D8A83]">Or Sign In with Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 text-[#F5F3ED] font-mono focus:outline-hidden"
            placeholder="admin@example.edu"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 text-[#F5F3ED] font-mono focus:outline-hidden"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-xl bg-[#F5F3ED] hover:bg-white text-black font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            Authenticate
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer"
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
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'tickets' | 'analytics'>('tickets');

  useEffect(() => {
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    if (saved) {
      setCurrentTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setCurrentTheme('light');
    }
  }, []);

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
    <div className="flex flex-col h-screen w-full bg-[#0B0B0B] text-[#F5F3ED] overflow-hidden transition-colors duration-200">
      <AdminNav
        currentTheme={currentTheme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0D] relative min-w-0 transition-all duration-200">
        {/* Subtle ambient warm backlight matching Chat UI */}
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(255,122,0,0.06),transparent_70%)]"
          aria-hidden="true"
        />
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
