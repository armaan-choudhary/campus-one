'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Ask',
      desc: 'Type your question naturally.',
    },
    {
      num: '02',
      title: 'Understand',
      desc: 'We detect the topic and intent.',
    },
    {
      num: '03',
      title: 'Connect',
      desc: 'Route to the right department or system.',
    },
    {
      num: '04',
      title: 'Resolve',
      desc: 'Get a clear, sourced answer (or handoff).',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full bg-white text-[#111111] py-16 sm:py-24 overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN: Steps */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#71717A] uppercase">
              <span className="text-[#F97316] font-bold text-sm">—</span>
              <span>HOW IT WORKS —</span>
            </div>

            {/* Headline: Clean bold sans-serif */}
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-[#111111] leading-[1.12]">
              One question. <br />
              The right answer.
            </h2>

            {/* Four Steps */}
            <div className="space-y-4 pt-2">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-3.5">
                  {/* Step Number Badge */}
                  <div className="w-8 h-8 rounded-lg border border-[#D5D3CE] bg-white flex items-center justify-center font-mono font-bold text-xs text-[#111111] shrink-0 mt-0.5 shadow-2xs">
                    {step.num}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-sans font-bold text-sm sm:text-base text-[#111111]">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#71717A] leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/workspace?role=student"
                className="inline-flex items-center gap-2 bg-[#0E0E0E] text-white hover:bg-black/85 active:scale-[0.98] text-xs sm:text-sm font-medium px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <span>See how it works</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Diary of a Wimpy Kid Laptop Illustration */}
          <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[620px] aspect-[16/9]">
              <Image
                src="/illustrations/wimpy/laptop-wimpy.webp"
                alt="CampusOne laptop demonstration with clear sourced answers in Diary of a Wimpy Kid style"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 620px"
                className="object-contain object-right pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
