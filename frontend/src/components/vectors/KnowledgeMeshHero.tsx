'use client';

import React from 'react';

interface KnowledgeMeshHeroProps {
  className?: string;
}

export const KnowledgeMeshHero: React.FC<KnowledgeMeshHeroProps> = ({ className = '' }) => {
  return (
    <div className={`relative mx-auto flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 440 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[420px] h-auto overflow-visible"
        aria-label="Campus Knowledge Mesh Network"
        role="img"
      >
        <defs>
          {/* Subtle Radial Glow for Center Core */}
          <radialGradient id="meshCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>

          {/* Gradients for Inter-Department Pathways */}
          <linearGradient id="orbitGradNorth" x1="220" y1="110" x2="220" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="orbitGradEast" x1="220" y1="110" x2="365" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="orbitGradSouth" x1="220" y1="110" x2="220" y2="192" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="orbitGradWest" x1="220" y1="110" x2="75" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Ambient Core Glow */}
        <circle cx="220" cy="110" r="95" fill="url(#meshCenterGlow)" className="animate-pulse-glow" style={{ transformOrigin: '220px 110px' }} />

        {/* Concentric Orbital Rings */}
        <circle
          cx="220"
          cy="110"
          r="82"
          stroke="var(--border-subtle)"
          strokeWidth="1"
          strokeDasharray="4 6"
          className="opacity-60 animate-flow-dash"
        />
        <circle
          cx="220"
          cy="110"
          r="54"
          stroke="var(--border-subtle)"
          strokeWidth="1"
          className="opacity-75"
        />

        {/* Cross Network Bus Lines */}
        <line x1="220" y1="28" x2="220" y2="192" stroke="var(--border-subtle)" strokeWidth="1" />
        <line x1="75" y1="110" x2="365" y2="110" stroke="var(--border-subtle)" strokeWidth="1" />

        {/* Diagonal Cross Weaves */}
        <line x1="120" y1="48" x2="320" y2="172" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 3" className="opacity-40" />
        <line x1="120" y1="172" x2="320" y2="48" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 3" className="opacity-40" />

        {/* Animated Signal Pulses Along Primary Tracks */}
        <circle cx="220" cy="65" r="2.5" fill="var(--accent)" className="animate-ping opacity-75" />
        <circle cx="295" cy="110" r="2.5" fill="var(--accent)" className="animate-ping opacity-75" style={{ animationDelay: '0.6s' }} />
        <circle cx="220" cy="155" r="2.5" fill="var(--accent)" className="animate-ping opacity-75" style={{ animationDelay: '1.2s' }} />
        <circle cx="145" cy="110" r="2.5" fill="var(--accent)" className="animate-ping opacity-75" style={{ animationDelay: '1.8s' }} />

        {/* 1. North Node: Registrar & Academic Records */}
        <g className="cursor-default group">
          <circle cx="220" cy="28" r="14" fill="var(--surface-2)" stroke="var(--border-subtle)" strokeWidth="1.2" />
          <path d="M215 26h10M215 29h7M215 32h5" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" />
          <text
            x="220"
            y="12"
            textAnchor="middle"
            fill="var(--text-tertiary)"
            fontSize="9.5"
            fontWeight="500"
            letterSpacing="0.04em"
            className="uppercase"
          >
            Registrar
          </text>
        </g>

        {/* 2. East Node: Bursar & Tuition Accounts */}
        <g className="cursor-default group">
          <circle cx="365" cy="110" r="14" fill="var(--surface-2)" stroke="var(--border-subtle)" strokeWidth="1.2" />
          <path d="M361 106h8v8h-8zM361 109h8" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" />
          <text
            x="365"
            y="136"
            textAnchor="middle"
            fill="var(--text-tertiary)"
            fontSize="9.5"
            fontWeight="500"
            letterSpacing="0.04em"
            className="uppercase"
          >
            Finance
          </text>
        </g>

        {/* 3. South Node: Central IT & Security */}
        <g className="cursor-default group">
          <circle cx="220" cy="192" r="14" fill="var(--surface-2)" stroke="var(--border-subtle)" strokeWidth="1.2" />
          <path d="M216 190l4 4 4-4M220 188v6" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <text
            x="220"
            y="216"
            textAnchor="middle"
            fill="var(--text-tertiary)"
            fontSize="9.5"
            fontWeight="500"
            letterSpacing="0.04em"
            className="uppercase"
          >
            IT Support
          </text>
        </g>

        {/* 4. West Node: Housing & Campus Life */}
        <g className="cursor-default group">
          <circle cx="75" cy="110" r="14" fill="var(--surface-2)" stroke="var(--border-subtle)" strokeWidth="1.2" />
          <path d="M70 112l5-4 5 4v5h-10v-5z" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <text
            x="75"
            y="136"
            textAnchor="middle"
            fill="var(--text-tertiary)"
            fontSize="9.5"
            fontWeight="500"
            letterSpacing="0.04em"
            className="uppercase"
          >
            Facilities
          </text>
        </g>

        {/* Central Core: CampusOne Hub */}
        <g>
          {/* Active Outer Ring */}
          <circle cx="220" cy="110" r="26" fill="var(--surface-1)" stroke="var(--border-medium)" strokeWidth="1.5" />
          <circle cx="220" cy="110" r="21" fill="var(--surface-2)" stroke="var(--border-subtle)" strokeWidth="1" />
          
          {/* Clean Central Pillar / Shield Vector */}
          <path
            d="M220 99l8 4.5v7.5c0 5.2-3.4 9.8-8 11-4.6-1.2-8-5.8-8-11v-7.5l8-4.5z"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="220" cy="107.5" r="2" fill="var(--foreground)" />
        </g>
      </svg>
    </div>
  );
};
