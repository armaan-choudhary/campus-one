'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole, PERSONAS } from '@/lib/demoFixtures';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';
import {
  Sun,
  Moon,
  Plus,
  PanelLeft,
  PanelLeftClose,
  ShieldCheck,
  Home,
  MessageSquare,
  Ticket,
  ExternalLink,
} from 'lucide-react';
import { useTickets } from '@/context/TicketContext';

interface TopNavProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  activeStudentTab?: 'chat' | 'tickets';
  onStudentTabChange?: (tab: 'chat' | 'tickets') => void;
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentRole,
  activeStudentTab = 'chat',
  onStudentTabChange,
  currentTheme,
  onToggleTheme,
  onNewChat,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, role: authRole } = useAuth();
  const { ongoingCount } = useTickets();
  const activePersona = PERSONAS[authRole] || PERSONAS.student;

  return (
    <header className="h-14 bg-[var(--surface-1)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[var(--border-subtle)] transition-colors">
      {/* Left: Sidebar Toggle, Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sidebar Toggle for Student Chat View */}
        {activeStudentTab === 'chat' && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
              !isSidebarOpen
                ? 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border-subtle)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
            }`}
            title={isSidebarOpen ? 'Hide inquiry history' : 'Show inquiry history'}
            aria-label={isSidebarOpen ? 'Hide inquiry history' : 'Show inquiry history'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Brand Link to Homepage */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group py-1 cursor-pointer"
          title="Return to CampusOne Homepage"
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

      {/* Center: Student Navigation Tabs (Assistant vs My Tickets) */}
      {onStudentTabChange && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)]/80 rounded-xl border border-[var(--border-subtle)] text-xs">
          <button
            onClick={() => onStudentTabChange('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
              activeStudentTab === 'chat'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>

          <button
            onClick={() => onStudentTabChange('tickets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
              activeStudentTab === 'tickets'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Tickets</span>
            {ongoingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center font-mono">
                {ongoingCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Right Controls: New Inquiry, Admin link (if applicable), Theme, Identity */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Link to Admin Console (if user is admin or wants to open separate admin page) */}
        {authRole === 'admin' ? (
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-medium transition-all cursor-pointer"
            title="Open Admin Ticket Console"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Console</span>
            <ExternalLink className="w-3 h-3 text-indigo-400/70" />
          </Link>
        ) : (
          <Link
            href="/admin"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] text-xs transition-colors cursor-pointer"
            title="Admin Login Portal"
          >
            <span>Staff / Admin</span>
          </Link>
        )}

        {/* New Inquiry Button (For Student Assistant chat) */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] active:scale-95 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 shadow-xs cursor-pointer group"
          aria-label="Start new inquiry"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New inquiry</span>
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

        {/* User Identity / Role Switcher Modal Trigger */}
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-[var(--surface-2)]/80 hover:bg-[var(--surface-3)] text-xs border border-[var(--border-subtle)] text-[var(--foreground)] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs group"
          title="Campus Identity & Role Access"
          aria-label="Manage user authentication and roles"
        >
          <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold text-[10px] flex items-center justify-center shrink-0">
            {activePersona.avatar}
          </div>
          <span className="hidden xl:inline text-xs font-medium max-w-[110px] truncate">
            {user?.displayName || activePersona.name}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] capitalize px-1 py-0.2 rounded bg-[var(--surface-3)]">
            {authRole}
          </span>
        </button>

        {/* Return to Home link icon */}
        <Link
          href="/"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] active:scale-95 transition-all duration-150 border border-transparent hover:border-[var(--border-subtle)] cursor-pointer"
          title="Return to Home overview"
          aria-label="Return to Home overview"
        >
          <Home className="w-4 h-4" />
        </Link>
      </div>

      {/* Campus Identity & RBAC Token Manager Modal */}
      <LoginModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};
