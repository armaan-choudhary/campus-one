'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export type DepartmentKey = 'registrar' | 'bursar' | 'it' | 'housing';

interface CampusWayfindingSignProps {
  deptKey: DepartmentKey;
  code: string;
  name: string;
  building: string;
  scope: string;
  room?: string;
  isActive?: boolean;
  className?: string;
}

const DEPT_THEMES: Record<DepartmentKey, { accent: string; borderActive: string; dotColor: string }> = {
  registrar: {
    accent: 'text-blue-400',
    borderActive: 'border-blue-500/60 bg-blue-500/[0.04]',
    dotColor: 'bg-blue-400',
  },
  bursar: {
    accent: 'text-amber-400',
    borderActive: 'border-amber-500/60 bg-amber-500/[0.04]',
    dotColor: 'bg-amber-400',
  },
  it: {
    accent: 'text-purple-400',
    borderActive: 'border-purple-500/60 bg-purple-500/[0.04]',
    dotColor: 'bg-purple-400',
  },
  housing: {
    accent: 'text-emerald-400',
    borderActive: 'border-emerald-500/60 bg-emerald-500/[0.04]',
    dotColor: 'bg-emerald-400',
  },
};

export const CampusWayfindingSign: React.FC<CampusWayfindingSignProps> = ({
  deptKey,
  code,
  name,
  building,
  scope,
  room,
  isActive = true,
  className = '',
}) => {
  const theme = DEPT_THEMES[deptKey];

  return (
    <div
      className={`relative p-3.5 rounded border font-mono transition-all duration-300 ${
        isActive
          ? `${theme.borderActive} shadow-xs opacity-100`
          : 'border-[var(--border-subtle)] bg-[var(--surface-1)]/40 opacity-40'
      } ${className}`}
    >
      {/* Wayfinding Top Label */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? theme.dotColor : 'bg-zinc-600'}`} />
          <span className="font-semibold text-[var(--foreground)]">{code}</span>
        </div>
        <span>{building}</span>
      </div>

      {/* Department Name & Scope */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className={`text-xs font-bold tracking-tight text-[var(--foreground)]`}>
            {name}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
            {scope}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] shrink-0">
          {room && <span className="text-[10px]">{room}</span>}
          <ArrowRight className={`w-3 h-3 ${isActive ? theme.accent : 'text-[var(--text-tertiary)]'}`} />
        </div>
      </div>
    </div>
  );
};
