'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { PERSONAS } from '@/lib/demoFixtures';
import { SEEDED_CREDENTIALS } from '@/lib/api';
import {
  X,
  Lock,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  KeyRound,
  LogOut,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIMARY_ROLES: { role: UserRole; label: string; page: string; icon: React.ElementType }[] = [
  { role: 'student', label: 'Student Portal', page: '/workspace', icon: GraduationCap },
  { role: 'admin', label: 'Admin Console', page: '/admin', icon: ShieldCheck },
];

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, role, accessToken, switchDemoPersona, login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('student@example.edu');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showDevClaims, setShowDevClaims] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      onClose();
      if (email.toLowerCase().includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/workspace');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    }
  };

  const handlePersonaSelect = async (selectedRole: UserRole) => {
    setError(null);
    try {
      await switchDemoPersona(selectedRole);
      onClose();
      if (selectedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/workspace');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to switch persona');
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/login');
  };

  const copyToken = () => {
    if (!accessToken) return;
    navigator.clipboard.writeText(accessToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const currentPersona = PERSONAS[role] || PERSONAS.student;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Centered Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative z-10 w-full max-w-md my-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-2)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] text-[var(--foreground)] flex items-center justify-center border border-[var(--border-subtle)]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                Campus Identity &amp; Access
              </h2>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                2 Roles &bull; Separate Portals (/workspace &amp; /admin)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Active Principal Badge */}
          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] font-bold font-mono text-xs flex items-center justify-center shrink-0">
                {currentPersona.avatar}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[var(--foreground)] truncate">
                  {user?.displayName || currentPersona.name}
                </div>
                <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
                  {user?.email || 'student@example.edu'} &bull; {currentPersona.badge}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-rose-400 p-1 rounded hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-500">
              {error}
            </div>
          )}

          {/* Quick Role Switch Cards */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Switch Role &amp; Open Portal
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_ROLES.map(({ role: itemRole, label, page, icon: Icon }) => {
                const p = PERSONAS[itemRole];
                const creds = SEEDED_CREDENTIALS[itemRole];
                const isSelected = role === itemRole;

                return (
                  <button
                    key={itemRole}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handlePersonaSelect(itemRole)}
                    className={`p-3 rounded-xl text-left flex items-center justify-between transition-all border cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[var(--surface-2)] border-[var(--foreground)] shadow-xs'
                        : 'bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)] border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] text-[var(--foreground)] flex items-center justify-center border border-[var(--border-subtle)] shrink-0">
                        <Icon className="w-4 h-4 text-[var(--accent)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 truncate">
                          <span>{label}</span>
                          <span className="text-[10px] font-mono text-[var(--text-secondary)] px-1.5 py-0.2 rounded bg-[var(--surface-3)]">
                            {page}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
                          {p.name} &bull; {creds?.email || `${itemRole}@example.edu`}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Sign-In Form */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                Sign In with Credentials
              </span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                Demo pass: <code className="bg-[var(--surface-2)] px-1 rounded">demo-password</code>
              </span>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu or admin@example.edu"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-hidden focus:border-[var(--accent)] font-mono transition-colors"
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:outline-hidden focus:border-[var(--accent)] font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2 px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Authenticating...' : 'Sign In and Load Portal'}</span>
              </button>
            </form>
          </div>

          {/* JWT Token Claims */}
          {accessToken && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowDevClaims(!showDevClaims)}
                className="w-full flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--foreground)] py-1 transition-colors cursor-pointer"
              >
                <span>Authorization Token (JWT)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDevClaims ? 'rotate-180' : ''}`} />
              </button>

              {showDevClaims && (
                <div className="mt-2 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[10px] font-mono space-y-2">
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Bearer Token</span>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="break-all text-[var(--text-secondary)] select-all bg-[var(--surface-1)] p-2 rounded-lg border border-[var(--border-subtle)] max-h-16 overflow-y-auto">
                    {accessToken}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
