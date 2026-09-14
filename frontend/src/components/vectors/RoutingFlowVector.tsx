'use client';

import React from 'react';

interface RoutingFlowVectorProps {
  domainLabel: string;
  confidence?: number;
  className?: string;
}

export const RoutingFlowVector: React.FC<RoutingFlowVectorProps> = ({
  domainLabel,
  confidence,
  className = '',
}) => {
  const percentText = confidence !== undefined ? `${Math.round(confidence * 100)}%` : 'Direct';

  return (
    <div className={`flex items-center gap-1.5 text-xs select-none ${className}`}>
      <svg
        viewBox="0 0 200 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-44 sm:w-52 h-6 overflow-visible"
        aria-hidden="true"
      >
        {/* Source Node: Student Query */}
        <circle cx="8" cy="12" r="5" fill="var(--surface-2)" stroke="var(--border-subtle)" strokeWidth="1.2" />
        <circle cx="8" cy="12" r="2" fill="var(--text-secondary)" />

        {/* Path 1: Source to Classifier with animated streaming flow */}
        <line
          x1="14"
          y1="12"
          x2="86"
          y2="12"
          stroke="var(--accent)"
          strokeOpacity="0.75"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          className="animate-flow-dash"
        />
        
        {/* Classifier Center Node */}
        <rect
          x="88"
          y="3"
          width="36"
          height="18"
          rx="9"
          fill="var(--surface-2)"
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
        <text
          x="106"
          y="15.5"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="9"
          fontWeight="600"
          letterSpacing="-0.02em"
        >
          {percentText}
        </text>

        {/* Path 2: Classifier to Target Domain */}
        <line x1="125" y1="12" x2="190" y2="12" stroke="var(--border-medium)" strokeWidth="1" />
        {/* Arrow head */}
        <polygon points="188,9.5 194,12 188,14.5" fill="var(--foreground)" />
      </svg>
      <span className="text-xs font-medium text-[var(--foreground)] truncate max-w-[140px] sm:max-w-none">
        {domainLabel}
      </span>
    </div>
  );
};
