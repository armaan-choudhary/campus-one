'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OrangeTicks } from './HandwrittenElements';

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="w-full bg-white text-[#111111] pt-14 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* LEFT COLUMN: Headline & CTA Button */}
          <div className="lg:col-span-5 space-y-5">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#71717A] uppercase">
              <span className="text-[#F97316] font-bold text-sm">—</span>
              <span>ONE CAMPUS &bull; A BETTER EXPERIENCE</span>
            </div>

            {/* Headline */}
            <h2 className="font-bold text-3xl sm:text-4xl lg:text-[46px] text-[#111111] leading-[1.12] tracking-tight">
              Your campus has dozens <br />
              of offices. <br />
              <span className="font-serif italic font-normal text-[#111111]">
                Students just need one front door.
              </span>
            </h2>

            {/* Button */}
            <div className="pt-2">
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 bg-[#0E0E0E] text-white hover:bg-black/85 active:scale-[0.98] text-xs sm:text-sm font-medium px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <span>Ask CampusOne</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>

            {/* Bottom-left Orange Ticks */}
            <div className="pt-4">
              <OrangeTicks count={3} direction="right" />
            </div>
          </div>

          {/* RIGHT COLUMN: Panorama campus sketch with students walking in Wimpy Kid style */}
          <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[640px] aspect-[16/9]">
              <Image
                src="/illustrations/wimpy/campus-wimpy-panorama.webp"
                alt="Diary of a Wimpy Kid style illustration of university campus with students walking towards buildings"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 640px"
                className="object-contain object-right pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
