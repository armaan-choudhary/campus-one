'use client';

import React, { useState, useEffect } from 'react';
import { HomeNavbar } from '@/components/home/HomeNavbar';
import { HomeHero } from '@/components/home/HomeHero';
import { MetricsBanner } from '@/components/home/MetricsBanner';
import { PersonaGrid } from '@/components/home/PersonaGrid';
import { CapabilitiesSection } from '@/components/home/CapabilitiesSection';
import { HomeFooter } from '@/components/home/HomeFooter';

export default function HomePage() {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('campusone-theme', next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top sticky navigation bar */}
      <HomeNavbar currentTheme={currentTheme} onToggleTheme={toggleTheme} />

      {/* Main landing sections */}
      <main className="flex-1 flex flex-col">
        <HomeHero />
        <MetricsBanner />
        <PersonaGrid />
        <CapabilitiesSection />
      </main>

      {/* Institutional footer */}
      <HomeFooter currentTheme={currentTheme} />
    </div>
  );
}
