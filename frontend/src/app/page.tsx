'use client';

import React from 'react';
import { EditorialNavbar } from '@/components/home/EditorialNavbar';
import { EditorialHero } from '@/components/home/EditorialHero';
import { ProblemSection } from '@/components/home/ProblemSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';
import { EditorialFooter } from '@/components/home/EditorialFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans selection:bg-[#F97316]/20 selection:text-[#111111] antialiased">
      {/* 1. Sticky Navigation Bar */}
      <EditorialNavbar />

      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <EditorialHero />

        {/* 3 & 4. Problem Statement & Student Scenarios (with Assistant Preview widget header) */}
        <ProblemSection />

        {/* 5. How It Works (Steps + 3D Laptop Mockup) */}
        <HowItWorksSection />

        {/* 6. Built For Real Campuses (3 Features + 4 Stats) */}
        <FeaturesSection />

        {/* 7. Final Call to Action (Dozens of offices + Panorama illustration) */}
        <FinalCtaSection />
      </main>

      {/* 8. Minimal Dark Footer */}
      <EditorialFooter />
    </div>
  );
}
