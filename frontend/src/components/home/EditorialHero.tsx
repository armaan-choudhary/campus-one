'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const EditorialHero: React.FC = () => {
  return (
    <section className="relative w-full bg-white text-[#111111] pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          {/* HERO LEFT: Editorial Typography & Copy */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-5 z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#71717A] uppercase">
              <span className="text-[#F97316] font-bold text-sm">—</span>
              <span>ONE CAMPUS &bull; EVERY QUESTION</span>
            </div>

            {/* Main Heading - Editorial Serif */}
            <h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-[58px] text-[#111111] leading-[1.08] tracking-tight">
              The campus assistant <br />
              that <span className="italic font-normal">actually</span> helps.
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-[#52525B] font-normal leading-relaxed max-w-md pt-0.5">
              Ask anything — academic, finance, IT, facilities or admin.
              CampusOne figures out where it belongs and gets you an answer.
            </p>

            {/* Primary & Secondary Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/workspace?role=student"
                className="inline-flex items-center gap-2 bg-[#0E0E0E] text-white hover:bg-black/85 active:scale-[0.98] text-xs sm:text-sm font-medium px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <span>Ask CampusOne</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-[#D4D2CD] bg-white text-[#111111] hover:bg-[#F4F4F5] active:scale-[0.98] text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>See how it works</span>
              </a>
            </div>

            {/* Social Proof Row */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex -space-x-1.5 overflow-hidden">
                <Image
                  src="/illustrations/wimpy/avatar-1.png"
                  alt="Student user"
                  width={24}
                  height={24}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover border border-zinc-200"
                />
                <Image
                  src="/illustrations/wimpy/avatar-2.png"
                  alt="Student user"
                  width={24}
                  height={24}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover border border-zinc-200"
                />
                <Image
                  src="/illustrations/wimpy/avatar-3.png"
                  alt="Student user"
                  width={24}
                  height={24}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover border border-zinc-200"
                />
                <Image
                  src="/illustrations/wimpy/avatar-4.png"
                  alt="Student user"
                  width={24}
                  height={24}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover border border-zinc-200"
                />
              </div>
              <span className="text-[11px] sm:text-xs text-[#52525B] font-medium">
                Used by 12,000+ students across 8 campuses
              </span>
            </div>
          </div>

          {/* HERO RIGHT: Hand-drawn Editorial Illustration & Service Badges */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[580px] aspect-[4/3] flex items-center justify-center">
              <Image
                src="/illustrations/wimpy/hero-wimpy-white.webp"
                alt="University student with laptop on campus steps with routed department badges in Diary of a Wimpy Kid style"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 580px"
                className="object-contain object-right pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
