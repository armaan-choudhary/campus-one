import React from 'react';
import Link from 'next/link';
import { CampusOneMark } from './CampusOneMark';

export const EditorialFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#0E0E0E] text-[#8E8F94] border-t border-[#1C1D24] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
        {/* Left: CampusOne logo + wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center text-white">
            <CampusOneMark size={16} />
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-white">
            CampusOne
          </span>
        </div>

        {/* Center: Privacy, Terms, Contact */}
        <div className="flex items-center gap-6 text-xs text-[#8E8F94]">
          <Link
            href="/workspace"
            className="hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/workspace"
            className="hover:text-white transition-colors"
          >
            Terms
          </Link>
          <a
            href="mailto:support@campusone.edu"
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </div>

        {/* Right: © 2026 CampusOne */}
        <div className="text-xs text-[#71717A]">
          &copy; 2026 CampusOne
        </div>
      </div>
    </footer>
  );
};
