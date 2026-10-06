'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Centered Modal Card matching Chat UI */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative z-10 w-full max-w-md my-auto rounded-2xl border border-[#22232B] bg-[#111216] text-[#F5F3ED] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1E1E24] flex items-center justify-between bg-[#14151B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#16171E] text-[#FF7A00] flex items-center justify-center border border-[#242531]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-serif font-bold text-[#F5F3ED] tracking-tight">
                Campus Identity &amp; Access<span className="text-[#FF7A00]">.</span>
              </h2>
              <p className="text-[11px] font-mono text-[#8D8A83]">
                2 Roles &bull; Separate Portals (/workspace &amp; /admin)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#1C1E26] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Active Principal Badge */}
          <div className="p-3 rounded-xl bg-[#16171E] border border-[#22232B] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-[#242531] flex items-center justify-center shrink-0 relative">
                <Image
                  src={role === 'admin' ? '/illustrations/wimpy/avatar-4.png' : '/illustrations/wimpy/avatar-1.png'}
                  alt="Principal Avatar"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[#F5F3ED] truncate">
                  {user?.displayName || currentPersona.name}
                </div>
                <div className="text-[11px] font-mono text-[#8D8A83] truncate">
                  {user?.email || 'student@example.edu'} &bull; {currentPersona.badge}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="text-[11px] font-mono text-[#8D8A83] hover:text-rose-400 p-1.5 rounded hover:bg-[#1C1E26] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400">
              {error}
            </div>
          )}

          {/* Quick Role Switch Cards */}
          <div className="space-y-2">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#8D8A83]">
              Switch Role &amp; Open Portal
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRIMARY_ROLES.map(({ role: itemRole, label, page, icon: RoleIcon }) => {
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
                        ? 'bg-[#16171E] border-[#FF7A00]/50 shadow-[0_0_12px_rgba(255,122,0,0.1)]'
                        : 'bg-[#121317] hover:bg-[#16171E] border-[#22232B] hover:border-[#FF7A00]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-[#FF7A00]/10 border-[#FF7A00]/30 text-[#FF7A00]' : 'bg-[#16171E] border-[#242531] text-[#8D8A83]'
                      }`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#F5F3ED] flex items-center gap-1.5 truncate">
                          <span>{label}</span>
                          <span className="text-[10px] font-mono text-[#8D8A83] px-1.5 py-0.2 rounded bg-[#0E0F13] border border-[#1E1E24]">
                            {page}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8D8A83] truncate">
                          {p.name} &bull; {creds?.email || `${itemRole}@example.edu`}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-[#FF7A00] shrink-0 ml-2" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-[#8D8A83] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Sign-In Form */}
          <div className="pt-2 border-t border-[#1E1E24] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8D8A83]">
                Sign In with Credentials
              </span>
              <span className="font-mono text-[10px] text-[#8D8A83]">
                Demo pass: <code className="bg-[#16171E] px-1 rounded text-[#F5F3ED] border border-[#242531]">demo-password</code>
              </span>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono text-[#8D8A83] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu or admin@example.edu"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] text-[#F5F3ED] placeholder:text-[#6A6965] focus:outline-hidden focus:border-[#FF7A00]/60 font-mono transition-colors"
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0E0F13] border border-[#22232B] text-[#F5F3ED] placeholder:text-[#6A6965] focus:outline-hidden focus:border-[#FF7A00]/60 font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#FF7A00] hover:bg-[#FF8A1F] text-black active:scale-[0.98] text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-[0_0_12px_rgba(255,122,0,0.3)]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Authenticating...' : 'Sign In and Load Portal'}</span>
              </button>
            </form>
          </div>

          {/* JWT Token Claims */}
          {accessToken && (
            <div className="pt-2 border-t border-[#1E1E24]">
              <button
                type="button"
                onClick={() => setShowDevClaims(!showDevClaims)}
                className="w-full flex items-center justify-between text-[11px] font-mono text-[#8D8A83] hover:text-[#F5F3ED] py-1 transition-colors cursor-pointer"
              >
                <span>Authorization Token (JWT)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDevClaims ? 'rotate-180' : ''}`} />
              </button>

              {showDevClaims && (
                <div className="mt-2 p-2.5 rounded-xl bg-[#0E0F13] border border-[#22232B] text-[10px] font-mono space-y-2">
                  <div className="flex items-center justify-between text-[#8D8A83]">
                    <span>Bearer Token</span>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="inline-flex items-center gap-1 text-[#FF7A00] hover:underline cursor-pointer"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="break-all text-[#8D8A83] select-all bg-[#08090C] p-2 rounded-lg border border-[#1E1E24] max-h-16 overflow-y-auto">
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
