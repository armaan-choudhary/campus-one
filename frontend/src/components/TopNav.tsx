'use client';

import React, { useState } from 'react';
import { UserRole, PERSONAS } from '@/lib/demoFixtures';
import {
  Sun,
  Moon,
  ChevronDown,
  Shield,
  Plus,
} from 'lucide-react';

interface TopNavProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewChat: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentRole,
  onRoleChange,
  currentTheme,
  onToggleTheme,
  onNewChat,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const activePersona = PERSONAS[currentRole];

  return (
    <header className="h-16 bg-[var(--surface-1)]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[var(--border-subtle)]">
      {/* Brand Identity: Standalone Logo + Typography */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img
            src={currentTheme === 'dark' ? '/logo.png' : '/logo-dark.png'}
            alt="CampusOne Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base tracking-tight text-[var(--foreground)]">
            CampusOne
          </span>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[var(--accent)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Single Front Door</span>
          </div>
        </div>
      </div>

      {/* Role Switcher (Persona Selector) */}
      <div className="relative">
        <button
          onClick={() => setShowRoleDropdown(!showRoleDropdown)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--foreground)] border border-[var(--border-subtle)] transition-all shadow-xs cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
            {activePersona.avatar}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-xs leading-none">{activePersona.badge}</span>
            <span className="text-[10px] text-[var(--text-secondary)] leading-none mt-1 hidden sm:inline">
              {activePersona.name}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>

        {/* Dropdown Menu */}
        {showRoleDropdown && (
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-72 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
              Switch Persona & View
            </div>
            {(Object.keys(PERSONAS) as UserRole[]).map((roleKey) => {
              const p = PERSONAS[roleKey];
              const isSelected = currentRole === roleKey;
              return (
                <button
                  key={roleKey}
                  onClick={() => {
                    onRoleChange(roleKey);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-semibold border border-[var(--border-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0">
                    {p.avatar}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs">{p.badge}</span>
                    <span className="text-[11px] text-[var(--text-tertiary)] font-normal">
                      {p.name} · {p.department}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls: Theme Switcher & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Theme Switcher Toggle (Sun / Moon) */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors shadow-xs cursor-pointer"
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--accent)]" />
          )}
        </button>

        {/* New Chat Button (Prominent for Student role) */}
        {currentRole === 'student' && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#131314] text-xs font-semibold px-4.5 py-2.5 rounded-full transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New inquiry</span>
          </button>
        )}
      </div>
    </header>
  );
};
