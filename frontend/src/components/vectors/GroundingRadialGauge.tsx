'use client';

import React from 'react';

interface GroundingRadialGaugeProps {
  score: number; // 0.00 to 1.00
  label?: string;
  size?: number;
}

export const GroundingRadialGauge: React.FC<GroundingRadialGaugeProps> = ({
  score,
  label = 'Policy Grounding',
  size = 76,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round(score * 100)));
  const radius = 28;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  // Sweep arc: 260 degrees (leaving 100 degrees open at the bottom)
  const arcLength = circumference * (260 / 360);
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] shadow-xs">
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          className="transform rotate-[140deg] overflow-visible"
        >
          {/* Background Track Arc */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Label and Status */}
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </span>
        <span className="text-xs font-semibold text-[var(--foreground)] mt-0.5">
          {percentage >= 90 ? 'Verified Match' : percentage >= 70 ? 'Moderate Confidence' : 'Low Alignment'}
        </span>
        <span className="text-[11px] text-[var(--text-secondary)] mt-0.5">
          Calibrated against 2026 Handbook
        </span>
      </div>
    </div>
  );
};
