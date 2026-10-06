'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { CampusOneMark } from '@/components/home/CampusOneMark';
import { HandwrittenNote, OrangeTicks } from '@/components/home/HandwrittenElements';
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoPersona, isLoading } = useAuth();
  const [email, setEmail] = useState('student@example.edu');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState<string | null>(null);
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
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col justify-between selection:bg-[#F97316]/20 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-[#1C1C1F] bg-[#0E0E0E]">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-5 h-5 flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <CampusOneMark size={18} />
          </div>
          <span className="font-sans font-bold text-base tracking-tight text-white">
            CampusOne
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8F94] hover:text-white hover:bg-[#16171D] active:scale-95 transition-all cursor-pointer"
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#8E8F94] uppercase">
              <span className="text-[#F97316] font-bold text-sm">—</span>
              <span>CAMPUS IDENTITY &amp; ACCESS GATEWAY</span>
              <OrangeTicks count={2} />
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white tracking-tight leading-[1.1]">
              Sign in to your <br />
              <span className="italic font-normal">campus portal</span>.
            </h1>
            <p className="text-xs text-[#8E8F94] max-w-sm mx-auto">
              CampusOne routes students and administrators to specialized portal interfaces.
            </p>
          </div>

          {/* Handwritten Annotation */}
          <div className="flex justify-center -my-1 pointer-events-none">
            <HandwrittenNote
              text={"One front door for\nevery university service."}
              arrowDirection="curve-down"
              color="#D4D4D8"
              textSize="text-xs sm:text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 text-center">
              {error}
            </div>
          )}

          {/* Dual Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Role Card with Wimpy Kid Avatar */}
            <div className="p-5 rounded-2xl bg-[#121316] border border-[#23242A] hover:border-[#3F4350] hover:bg-[#18191E] flex flex-col justify-between space-y-4 transition-all duration-200 group shadow-xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-[#3F4350] flex items-center justify-center transition-transform group-hover:scale-105 relative">
                  <Image
                    src="/illustrations/wimpy/avatar-1.png"
                    alt="Student Alex"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono border bg-[#1C1E26] text-white border-[#3F4350] mb-1.5">
                    <span className="w-0.5 h-2.5 bg-[#38BDF8] rounded-full inline-block" />
                    <span>Student Services</span>
                  </span>
                  <h2 className="text-sm font-semibold text-white">
                    Student Portal
                  </h2>
                  <p className="text-[11px] text-[#8E8F94] mt-1 leading-relaxed">
                    AI Assistant for university inquiries and real-time personal ticket tracking.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleQuickLogin('student')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-[#0E0E0E] hover:bg-zinc-200 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between shadow-xs"
              >
                <span>Enter as Student</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Role Card */}
            <div className="p-5 rounded-2xl bg-[#121316] border border-[#23242A] hover:border-[#3F4350] hover:bg-[#18191E] flex flex-col justify-between space-y-4 transition-all duration-200 group shadow-xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1C1E26] border border-[#282A33] text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono border bg-[#1C1E26] text-white border-[#3F4350] mb-1.5">
                    <span className="w-0.5 h-2.5 bg-[#38BDF8] rounded-full inline-block" />
                    <span>Central IT &amp; Staff</span>
                  </span>
                  <h2 className="text-sm font-semibold text-white">
                    Admin Console
                  </h2>
                  <p className="text-[11px] text-[#8E8F94] mt-1 leading-relaxed">
                    Dedicated ticket triage console to claim, manage, and resolve student issues.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleQuickLogin('admin')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#272932] hover:bg-[#343743] text-white border border-[#3F4350] text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between shadow-xs"
              >
                <span>Enter as Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Form Login */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#121316] border border-[#23242A] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#8E8F94] uppercase tracking-wider">
                Direct Credentials
              </span>
              <span className="text-[10px] font-mono text-[#666666]">
                Demo pass: <code className="bg-[#1C1E26] px-1.5 py-0.5 rounded text-zinc-300 border border-[#282A33]">demo-password</code>
              </span>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8E8F94] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu or admin@example.edu"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#1A1C22] border border-[#282A33] text-white font-mono focus:outline-hidden focus:border-[#3F4350]"
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#1A1C22] border border-[#282A33] text-white font-mono focus:outline-hidden focus:border-[#3F4350]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#0E0E0E] text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
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
              className="inline-flex items-center gap-1.5 text-xs text-[#8E8F94] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Campus Directory</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 px-6 flex items-center justify-center border-t border-[#1C1C1F] text-[11px] text-[#666666] font-mono">
        CampusOne &bull; Dual-Role RBAC Architecture
      </footer>
    </div>
  );
}

