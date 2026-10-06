import React from 'react';

interface HandwrittenNoteProps {
  text: string;
  arrowDirection?: 'down-left' | 'down-right' | 'up-left' | 'up-right' | 'curve-down' | 'curve-up' | 'none';
  className?: string;
  color?: string;
  textSize?: string;
}

/**
 * Clean ink handwritten annotations and organic curved arrows.
 * Matches the editorial pen style in the reference design.
 */
export const HandwrittenNote: React.FC<HandwrittenNoteProps> = ({
  text,
  arrowDirection = 'down-left',
  className = '',
  color = '#18181B',
  textSize = 'text-base sm:text-lg',
}) => {
  return (
    <div className={`inline-flex flex-col items-center pointer-events-none select-none font-handwritten ${className}`}>
      <span
        className={`${textSize} font-semibold leading-tight text-center tracking-normal transform -rotate-1 whitespace-pre-line`}
        style={{ color }}
      >
        {text}
      </span>
      {arrowDirection === 'down-left' && (
        <svg
          width="44"
          height="28"
          viewBox="0 0 44 28"
          fill="none"
          className="mt-0.5"
          aria-hidden="true"
        >
          <path
            d="M36 2C30 12 18 20 6 23M6 23L14 19M6 23L10 27"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {arrowDirection === 'down-right' && (
        <svg
          width="44"
          height="28"
          viewBox="0 0 44 28"
          fill="none"
          className="mt-0.5"
          aria-hidden="true"
        >
          <path
            d="M8 2C14 12 26 20 38 23M38 23L30 19M38 23L34 27"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {arrowDirection === 'curve-down' && (
        <svg
          width="36"
          height="32"
          viewBox="0 0 36 32"
          fill="none"
          className="mt-0.5"
          aria-hidden="true"
        >
          <path
            d="M18 2C22 10 28 18 16 28M16 28L12 21M16 28L22 24"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {arrowDirection === 'curve-up' && (
        <svg
          width="36"
          height="32"
          viewBox="0 0 36 32"
          fill="none"
          className="mb-0.5"
          aria-hidden="true"
        >
          <path
            d="M16 30C28 20 22 12 18 4M18 4L13 10M18 4L23 9"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

/**
 * Orange radiating pencil tick marks (///) found in hero, cards, stats, and CTA
 */
export const OrangeTicks: React.FC<{ className?: string; count?: 2 | 3; direction?: 'right' | 'left' }> = ({
  className = '',
  count = 3,
  direction = 'right',
}) => {
  return (
    <span className={`inline-flex items-center gap-1 select-none pointer-events-none text-[#F97316] ${className}`} aria-hidden="true">
      <svg width={count === 3 ? "24" : "18"} height="16" viewBox={count === 3 ? "0 0 24 16" : "0 0 18 16"} fill="none">
        {direction === 'right' ? (
          <>
            <line x1="2" y1="14" x2="8" y2="2" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="9" y1="14" x2="15" y2="2" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            {count === 3 && (
              <line x1="16" y1="14" x2="22" y2="2" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </>
        ) : (
          <>
            <line x1="6" y1="2" x2="0" y2="14" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="13" y1="2" x2="7" y2="14" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            {count === 3 && (
              <line x1="20" y1="2" x2="14" y2="14" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </>
        )}
      </svg>
    </span>
  );
};
