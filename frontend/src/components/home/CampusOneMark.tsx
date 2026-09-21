import React from 'react';

interface CampusOneMarkProps {
  className?: string;
  size?: number;
}

/**
 * CampusOne Convergence Motif
 * Visually communicates: "multiple paths → one destination / single front door"
 * Four distinct avenues converging into one central point.
 */
export const CampusOneMark: React.FC<CampusOneMarkProps> = ({
  className = 'text-current',
  size = 16,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Four directional vectors converging inward */}
      <path
        d="M3.5 3.5L9.5 9.5M20.5 3.5L14.5 9.5M3.5 20.5L9.5 14.5M20.5 20.5L14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Central destination / front door node */}
      <rect
        x="9.5"
        y="9.5"
        width="5"
        height="5"
        rx="1"
        fill="currentColor"
      />
    </svg>
  );
};
