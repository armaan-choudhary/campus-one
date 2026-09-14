'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserRole, PERSONAS } from '@/lib/demoFixtures';
import {
  Sun,
  Moon,
  ChevronDown,
  Plus,
  PanelLeft,
  PanelLeftClose,
  GraduationCap,
  Headphones,
  Database,
  BarChart3,
  Home,
} from 'lucide-react';

interface TopNavProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const ROLE_ITEMS: { role: UserRole; label: string; icon: React.ElementType }[] = [
  { role: 'student', label: 'Student', icon: GraduationCap },
  { role: 'agent', label: 'Agent Queue', icon: Headphones },
  { role: 'knowledge_admin', label: 'Knowledge', icon: Database },
  { role: 'executive', label: 'Analytics', icon: BarChart3 },
];

export const TopNav: React.FC<TopNavProps> = ({
  currentRole,
  onRoleChange,
  currentTheme,
  onToggleTheme,
  onNewChat,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activePersona = PERSONAS[currentRole];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowRoleDropdown(false);
      }
    };

    if (showRoleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showRoleDropdown]);

  return (
    <header className="h-14 bg-[var(--surface-1)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[var(--border-subtle)] transition-colors">
      {/* Left: Sidebar Toggle, Brand Identity & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sidebar Toggle for Student View */}
        {currentRole === 'student' && onToggleSidebar && (
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

        <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-medium">
          <span className="text-[var(--text-tertiary)]">/</span>
          <span>Workspace</span>
        </div>
      </div>

      {/* Center: Desktop Segmented Control & Mobile Compact Dropdown */}
      <div className="flex items-center">
        {/* Desktop Segmented Role Switcher */}
        <nav
          className="hidden md:inline-flex items-center p-0.5 rounded-lg bg-[var(--surface-2)]/70 border border-[var(--border-subtle)] text-xs font-medium"
          aria-label="Workspace view selector"
        >
          {ROLE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => onRoleChange(item.role)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all duration-150 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-1)]/50'
                }`}
                aria-pressed={isSelected}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-indigo-500' : 'text-[var(--text-secondary)]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Compact Dropdown */}
        <div ref={dropdownRef} className="relative md:hidden">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--surface-2)]/80 hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--foreground)] border border-[var(--border-subtle)] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
            aria-expanded={showRoleDropdown}
            aria-haspopup="true"
          >
            <span className="font-semibold text-xs">{activePersona.badge}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>

          {showRoleDropdown && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
              {ROLE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = currentRole === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      onRoleChange(item.role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 text-xs transition-all duration-150 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/60'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-indigo-500' : 'text-[var(--text-secondary)]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Home link, Theme Switcher & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Return to Home link icon */}
        <Link
          href="/"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] active:scale-95 transition-all duration-150 border border-transparent hover:border-[var(--border-subtle)] cursor-pointer"
          title="Return to Home overview"
          aria-label="Return to Home overview"
        >
          <Home className="w-4 h-4" />
        </Link>

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

        {/* New Chat Button (For Student role) */}
        {currentRole === 'student' && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] active:scale-95 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 shadow-xs cursor-pointer group"
            aria-label="Start new inquiry"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New inquiry</span>
          </button>
        )}
      </div>
    </header>
  );
};
