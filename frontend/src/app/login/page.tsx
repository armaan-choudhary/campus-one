'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoPersona, isLoading, isAuthenticated, role } = useAuth();
  const [email, setEmail] = useState('student@example.edu');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setCurrentTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('campusone-theme', next);
      return next;
    });
  };

  const handleRoleQuickLogin = async (selectedRole: UserRole) => {
    setError(null);
    try {
      await switchDemoPersona(selectedRole);
      if (selectedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/workspace');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      // Role is updated in AuthContext state
      const isStaffOrAdmin = email.toLowerCase().includes('admin');
      if (isStaffOrAdmin) {
        router.push('/admin');
      } else {
        router.push('/workspace');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <Link href="/" className="flex items-center gap-2.5 group">
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
          <span className="font-semibold text-sm tracking-tight text-[var(--foreground)]">
            CampusOne
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] active:scale-95 transition-all cursor-pointer"
          aria-label="Toggle theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
              <Lock className="w-3 h-3 text-[var(--accent)]" />
              <span>Campus Unified Authentication Gateway</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Choose your role to sign in
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              CampusOne routes students and administrators to specialized portal interfaces.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-500 text-center">
              {error}
            </div>
          )}

          {/* Dual Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Role Card */}
            <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-emerald-500/50 flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-lg group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>Student Portal</span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    AI Assistant for campus inquiries and real-time personal ticket tracking.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleQuickLogin('student')}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--surface-2)] hover:bg-emerald-600 hover:text-white text-xs font-medium border border-[var(--border-subtle)] group-hover:border-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
              >
                <span>Enter as Student</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Role Card */}
            <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-indigo-500/50 flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-lg group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>Admin Console</span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Dedicated ticket triage console to claim, manage, and resolve student issues.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleQuickLogin('admin')}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
              >
                <span>Enter as Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Form Login */}
          <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
                Direct Credentials
              </span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                Default pass: <code className="bg-[var(--surface-2)] px-1 rounded">demo-password</code>
              </span>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu or admin@example.edu"
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
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Signing In...' : 'Sign In and Launch Portal'}</span>
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Campus Directory</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 px-6 flex items-center justify-center border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)] font-mono">
        CampusOne &bull; Dual-Role RBAC Architecture
      </footer>
    </div>
  );
}
