'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CampusLoaderProps {
  fullscreen?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LOADING_STAGES = [
  'Initializing campus knowledge mesh...',
  'Calibrating multi-domain routing engine...',
  'Mounting verified 2026 handbook vectors...',
  'Connecting single front door gateway...',
];

export const CampusLoader: React.FC<CampusLoaderProps> = ({
  fullscreen = false,
  label,
  size = 'md',
}) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const dimensions =
    size === 'sm'
      ? { box: 64, logo: 32, ring: 54 }
      : size === 'lg'
      ? { box: 128, logo: 64, ring: 110 }
      : { box: 96, logo: 48, ring: 82 };

  const content = (
    <div className="flex flex-col items-center justify-center gap-5 p-6 text-center select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Animated Orbital Beacon Center */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimensions.box, height: dimensions.box }}
      >
        {/* Outer Orbiting SVG Rings */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '6s' }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="opacity-40"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="24 120"
            strokeLinecap="round"
          />
        </svg>

        {/* Counter-rotating Inner Orbit Ring */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '3.5s', animationDirection: 'reverse' }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="16 80"
            strokeLinecap="round"
            className="opacity-70"
          />
        </svg>

        {/* Pulsing Ambient Halo */}
        <div className="absolute inset-3 rounded-full bg-[var(--accent)]/10 blur-md animate-pulse-glow" />

        {/* Center Logo Monogram */}
        <div
          className="relative rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-lg flex items-center justify-center p-2 z-10"
          style={{ width: dimensions.logo, height: dimensions.logo }}
        >
          <Image
            src="/logo.png"
            alt="CampusOne Archway Logo"
            width={dimensions.logo - 8}
            height={dimensions.logo - 8}
            className="object-contain dark:block hidden"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="CampusOne Archway Logo"
            width={dimensions.logo - 8}
            height={dimensions.logo - 8}
            className="object-contain dark:hidden block"
            priority
          />
        </div>
      </div>

      {/* Dynamic Staged Progress Label */}
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
          {label || LOADING_STAGES[stageIndex]}
        </p>
        <p className="text-xs text-[var(--text-secondary)] font-mono">
          CampusOne Universal Gateway
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 pt-1">
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === stageIndex
                ? 'w-4 bg-[var(--accent)]'
                : 'bg-[var(--border-medium)]'
            }`}
          />
        ))}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--background)]/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
