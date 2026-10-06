'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, CreditCard, Headphones } from 'lucide-react';
import { OrangeTicks } from './HandwrittenElements';

import { AssistantPreview } from './AssistantPreview';

export const ProblemSection: React.FC = () => {
  const scenarios = [
    {
      id: 'academic',
      question: 'I need to get an exam rescheduled.',
      department: 'Academic Registrar',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      image: '/illustrations/wimpy/academic-trans.webp',
      alt: 'Student needing exam reschedule',
      hasTicks: true,
    },
    {
      id: 'finance',
      question: 'Can I get a refund for my hostel fee?',
      department: 'Student Accounts',
      icon: <CreditCard className="w-3.5 h-3.5" />,
      image: '/illustrations/wimpy/finance-trans.webp',
      alt: 'Student inquiring about fee refund',
      hasTicks: false,
    },
    {
      id: 'it',
      question: "Wi-Fi isn't working in my hostel.",
      department: 'IT Helpdesk',
      icon: <Headphones className="w-3.5 h-3.5" />,
      image: '/illustrations/wimpy/it-trans-v2.webp',
      alt: 'Student troubleshooting campus wifi',
      hasTicks: true,
    },
  ];

  return (
    <section
      id="problem"
      className="w-full bg-[#0E0E0E] text-white pb-24 sm:pb-32 relative"
    >
      {/* 3. Floating Assistant Preview widget overlapping hero transition */}
      <AssistantPreview />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20">
        {/* Section Header: Two Columns */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16 sm:mb-20">
          {/* Left Column: Heading with Editorial Serif accent */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#8E8F94] uppercase">
              <span className="text-[#F97316] font-bold text-sm">—</span>
              <span>THE PROBLEM</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-white leading-[1.12]">
              Students don&rsquo;t think <br />
              in departments. <br />
              <span className="font-serif italic font-normal text-white">
                They think in problems.
              </span>
            </h2>
          </div>

          {/* Right Column: Narrative Copy */}
          <div className="md:pt-8 max-w-sm">
            <p className="text-xs sm:text-sm text-[#8E8F94] font-normal leading-relaxed">
              You have a question. Not a department name.
              CampusOne understands what you mean, finds the
              right place, and gets you a real answer &mdash; fast.
            </p>
          </div>
        </div>

        {/* Three Illustrated Student Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-end">
          {scenarios.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col items-center group"
            >
              {/* Optional Orange Ticks on the left */}
              {item.hasTicks && (
                <div className="absolute -left-2 sm:left-2 bottom-16 z-10">
                  <OrangeTicks count={3} direction="right" />
                </div>
              )}

              {/* Character Illustration and Speech Bubble Row */}
              <div className="relative flex items-center justify-center gap-2 sm:gap-3 w-full mb-3">
                {/* Character Bust */}
                <div className="relative w-32 h-36 sm:w-36 sm:h-40 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="160px"
                    className="object-contain object-bottom pointer-events-none select-none"
                  />
                </div>

                {/* Speech Bubble */}
                <div className="relative bg-[#18191E] border border-[#282A33] rounded-xl px-3.5 py-2.5 shadow-md text-left max-w-[190px]">
                  <p className="font-handwritten text-sm sm:text-base text-zinc-100 leading-snug">
                    &ldquo;{item.question}&rdquo;
                  </p>
                  {/* Speech pointer triangle */}
                  <div
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-[#18191E] border-l border-b border-[#282A33] transform rotate-45"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Department Pill Badge (Centered below the student) */}
              <div className="flex justify-center w-full">
                <Link
                  href={`/workspace?role=student&q=${encodeURIComponent(item.question)}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18191E] border border-[#2A2C36] text-white hover:bg-[#22242D] hover:border-[#3D4050] transition-colors text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <span className="text-[#8E8F94]">{item.icon}</span>
                  <span>{item.department}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
