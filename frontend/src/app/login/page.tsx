'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { CampusOneMark } from '@/components/home/CampusOneMark';
import {
  ShieldCheck,
  GraduationCap,
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
              Sign in to your campus portal<span className="text-[#FF7A00]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#8D8A83] font-sans max-w-sm mx-auto">
              Unified portal access for students and central campus administration.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 text-center">
              {error}
            </div>
          )}

          {/* Dual Role Selector Cards matching Chat UI card aesthetics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Role Card */}
            <div className="group relative p-5 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/50 flex flex-col justify-between space-y-4 transition-all duration-200 shadow-md overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#16171E] border border-[#242531] text-[#FF7A00] flex items-center justify-center transition-transform group-hover:scale-105">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[11px] text-[#8D8A83] uppercase block mb-1">
                    — STUDENT SERVICES //
                  </span>
                  <h2 className="text-base font-serif font-bold text-[#F5F3ED]">
                    Student Portal
                  </h2>
                  <p className="text-xs text-[#8D8A83] mt-1 font-sans leading-relaxed">
                    AI Assistant for university inquiries and personal ticket tracking.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleQuickLogin('student')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#FF7A00] text-black hover:bg-[#FF8A1F] text-xs font-bold font-mono transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between shadow-[0_0_12px_rgba(255,122,0,0.3)]"
              >
                <span>Enter as Student</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>

            {/* Admin Role Card */}
            <div className="group relative p-5 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/50 flex flex-col justify-between space-y-4 transition-all duration-200 shadow-md overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#16171E] border border-[#242531] text-[#FF7A00] flex items-center justify-center transition-transform group-hover:scale-105">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[11px] text-[#8D8A83] uppercase block mb-1">
                    — CENTRAL IT &amp; STAFF //
                  </span>
                  <h2 className="text-base font-serif font-bold text-[#F5F3ED]">
                    Admin Console
                  </h2>
                  <p className="text-xs text-[#8D8A83] mt-1 font-sans leading-relaxed">
                    Dedicated ticket triage console to claim, manage, and resolve work orders.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleQuickLogin('admin')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#16171E] hover:bg-[#1F212A] text-[#F5F3ED] border border-[#282A35] hover:border-[#FF7A00]/40 text-xs font-semibold font-mono transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between"
              >
                <span>Enter as Admin</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8D8A83]" />
              </button>
            </div>
          </div>

          {/* Form Login */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#121317]/85 border border-[#22232B] space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#8D8A83] uppercase tracking-wider">
                Direct Credentials
              </span>
              <span className="text-[10px] font-mono text-[#8D8A83]">
                Demo pass: <code className="bg-[#16171E] px-1.5 py-0.5 rounded text-[#F5F3ED] border border-[#242531]">demo-password</code>
              </span>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8D8A83] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu or admin@example.edu"
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
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 text-[#F5F3ED] font-mono focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F5F3ED] hover:bg-white text-black text-xs font-bold font-mono shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Sign In With Credentials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
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
