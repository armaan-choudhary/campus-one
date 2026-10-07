'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerWithApi } from '@/lib/api';
import { CampusOneMark } from '@/components/home/CampusOneMark';
import {
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Sun,
  Moon,
  ArrowLeft,
  UserPlus,
  LogIn,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [authTab, setAuthTab] = useState<'student' | 'admin' | 'register'>('student');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');

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

  const handleQuickLogin = async (target: 'student' | 'admin') => {
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      if (target === 'admin') {
        await login({ email: 'admin@example.edu', password: 'demo-password' });
        router.push('/admin');
      } else {
        await login({ email: 'student@example.edu', password: 'demo-password' });
        router.push('/workspace');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Quick authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (authTab === 'register') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name');
        }
        await registerWithApi({
          email: email.trim(),
          password,
          display_name: displayName.trim(),
        });
        setSuccessMsg('Account created successfully! Signing in...');
        await login({ email: email.trim(), password });
        router.push('/workspace');
      } else {
        await login({ email: email.trim(), password });
        const isStaffOrAdmin =
          authTab === 'admin' ||
          email.toLowerCase().includes('admin') ||
          email.toLowerCase().includes('agent');
        if (isStaffOrAdmin) {
          router.push('/admin');
        } else {
          router.push('/workspace');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F5F3ED] flex flex-col justify-between selection:bg-[#FF7A00]/20 selection:text-white transition-colors duration-200 relative overflow-hidden">
      {/* Subtle ambient warm backlight matching Chat UI */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(255,122,0,0.06),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Top Header matching TopNav */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-[#292929] bg-[#0B0B0B] relative z-10">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-4.5 h-4.5 flex items-center justify-center text-[#F5F3ED] transition-transform group-hover:scale-105">
            <CampusOneMark size={16} />
          </div>
          <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#F5F3ED]">
            CampusOne
          </span>
          <span className="text-[#292929] text-xs font-mono hidden sm:inline">/</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#8D8A83] hidden sm:inline">
            Identity Gateway
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#151515] active:scale-95 transition-all cursor-pointer"
          aria-label="Toggle theme"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 relative z-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA]">
              <span className="w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)] animate-pulse" />
              <span className="text-[#FF7A00] font-semibold">Campus Identity &amp; Access</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#F5F3ED] tracking-tight leading-tight">
              {authTab === 'admin'
                ? 'Staff & Admin Clearance'
                : authTab === 'register'
                ? 'Student Registration'
                : 'Sign in to Campus Portal'}
              <span className="text-[#FF7A00]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#8D8A83] font-sans max-w-sm mx-auto">
              {authTab === 'admin'
                ? 'Restricted incident triage console for university specialists and administration.'
                : authTab === 'register'
                ? 'Create a persistent student identity in the university directory.'
                : 'Unified portal access with conversational AI support and personal ticket index.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 text-center">
              {successMsg}
            </div>
          )}

          {/* Mode Switcher Tabs (Student vs Admin vs Registration) */}
          <div className="flex rounded-xl bg-[#121317]/85 border border-[#22232B] p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setAuthTab('student');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authTab === 'student'
                  ? 'bg-[#1C1E26] text-[#FF7A00] font-semibold border border-[#2F3240] shadow-xs'
                  : 'text-[#8D8A83] hover:text-[#F5F3ED]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('admin');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authTab === 'admin'
                  ? 'bg-[#1C1E26] text-[#FF7A00] font-semibold border border-[#2F3240] shadow-xs'
                  : 'text-[#8D8A83] hover:text-[#F5F3ED]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Staff &amp; Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authTab === 'register'
                  ? 'bg-[#1C1E26] text-[#FF7A00] font-semibold border border-[#2F3240] shadow-xs'
                  : 'text-[#8D8A83] hover:text-[#F5F3ED]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* 1-Click Fast-Track Clearance for Evaluation & Quick Access */}
          {authTab !== 'register' && (
            <div className="p-4 rounded-xl bg-[#0E0F13] border border-[#22232B] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8D8A83]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span>1-Click Fast-Track Clearance</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Quick Demo Access
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickLogin(authTab === 'admin' ? 'admin' : 'student')}
                disabled={isLoading || isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF7A00] text-black hover:bg-[#FF8A1F] font-bold text-xs shadow-[0_0_12px_rgba(255,122,0,0.35)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-mono disabled:opacity-50"
              >
                {authTab === 'admin' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>
                      {isSubmitting ? 'Authenticating...' : 'Sign in as System Administrator'}
                    </span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-black" />
                    <span>
                      {isSubmitting ? 'Authenticating...' : 'Sign in as Student (Alex Rivera)'}
                    </span>
                  </>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          )}

          {/* Authentication Form */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#121317]/85 border border-[#22232B] space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C1D24]">
              <span className="text-xs font-mono text-[#8D8A83] uppercase tracking-wider">
                {authTab === 'register'
                  ? 'Self-Service Enrollment'
                  : authTab === 'admin'
                  ? 'Administrator Credentials'
                  : 'Student Account Credentials'}
              </span>
              <span className="text-[10px] font-mono text-[#8D8A83]">
                {authTab === 'admin' ? 'Routes to /admin' : 'Routes to /workspace'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authTab === 'register' && (
                <div>
                  <label className="block text-[11px] font-mono text-[#8D8A83] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    required
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 text-[#F5F3ED] font-mono focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-[#8D8A83] mb-1">
                  {authTab === 'admin' ? 'Administrator Email' : 'Institutional Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={authTab === 'admin' ? 'admin@example.edu' : 'name@campus.edu'}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 text-[#F5F3ED] font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8D8A83] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 text-[#F5F3ED] font-mono focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F5F3ED] hover:bg-white text-black text-xs font-bold font-mono transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-black" />
                <span>
                  {isSubmitting
                    ? 'Authenticating...'
                    : authTab === 'register'
                    ? 'Create Student Account'
                    : authTab === 'admin'
                    ? 'Authenticate as Administrator'
                    : 'Sign In to Student Portal'}
                </span>
              </button>
            </form>
          </div>

          {/* Quick Notice about Access Routing */}
          <div className="p-3.5 rounded-xl bg-[#0E0F13] border border-[#22232B] text-[11px] font-sans text-[#8D8A83] space-y-1">
            <div className="font-mono text-[#F5F3ED] text-[11px] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Role-Segregated Multi-Tenant Architecture</span>
            </div>
            <p className="leading-relaxed">
              Student accounts open directly to the conversational AI assistant and ticket tracking at{' '}
              <code className="text-[#FF7A00]">/workspace</code>. Administrator and staff accounts route to the centralized incident triage console at{' '}
              <code className="text-[#FF7A00]">/admin</code>.
            </p>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to CampusOne Landing Page</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#1C1D24] text-center text-xs font-mono text-[#8D8A83] relative z-10">
        <span>CampusOne Single Front Door &bull; Identity Gateway</span>
      </footer>
    </div>
  );
}
