'use client';

import React from 'react';
import { MessageSquare, Sparkles, Users } from 'lucide-react';
import { OrangeTicks } from './HandwrittenElements';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <MessageSquare className="w-5 h-5 text-[#F97316]" />,
      title: 'Multi-domain intelligence',
      description:
        'Understands and routes across academic, finance, IT, facilities and administration.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#F97316]" />,
      title: 'Trusted, sourced answers',
      description:
        'Responses are grounded in official university policies and systems.',
    },
    {
      icon: <Users className="w-5 h-5 text-[#F97316]" />,
      title: 'Works for everyone',
      description:
        'Students get fast answers. Staff get fewer repetitive queries. Universities get better visibility.',
    },
  ];

  const stats = [
    { value: '100%', label: 'Grounded & Cited Claims' },
    { value: '4', label: 'Isolated Knowledge Stores' },
    { value: '< 1s', label: 'Median Turn Latency' },
    { value: '2-Turn', label: 'Clarification Loop Guard' },
  ];

  return (
    <section
      id="features"
      className="w-full bg-[#0E0E0E] text-white pt-16 pb-20 sm:pt-20 sm:pb-24 overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Two Columns */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12 sm:mb-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#8E8F94] uppercase">
              <span className="text-[#F97316] font-bold text-sm">—</span>
              <span>BUILT FOR REAL CAMPUSES</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Everything you need, <br />
              none of the chaos.
            </h2>
          </div>

          <div className="md:pt-8 max-w-sm">
            <p className="text-xs sm:text-sm text-[#8E8F94] font-normal leading-relaxed">
              CampusOne brings all campus services into a single,
              intelligent assistant &mdash; reducing confusion for students
              and workload for staff.
            </p>
          </div>
        </div>

        {/* Three Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-16 sm:mb-20">
          {features.map((card, idx) => (
            <div
              key={idx}
              className="bg-[#131418] border border-[#22242B] rounded-2xl p-6 sm:p-7 flex flex-col space-y-3.5 hover:border-[#333640] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                {card.icon}
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {card.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#8E8F94] leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Four Statistics Row */}
        <div className="relative pt-6 border-t border-[#1C1D24]">
          {/* Far-left Orange Ticks */}
          <div className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 hidden sm:block">
            <OrangeTicks count={3} direction="right" />
          </div>

          {/* Far-right Orange Ticks */}
          <div className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 hidden sm:block">
            <OrangeTicks count={3} direction="left" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 text-center">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center px-2 ${
                  idx < stats.length - 1 ? 'md:border-r md:border-[#22242B]' : ''
                }`}
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] sm:text-xs text-[#8E8F94] mt-1 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
