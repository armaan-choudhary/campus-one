'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { HomeNavbar } from '@/components/home/HomeNavbar';
import { HomeHero } from '@/components/home/HomeHero';
import { CampusMapSection } from '@/components/home/CampusMapSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { InstitutionalTrust } from '@/components/home/InstitutionalTrust';
import { FinalCta } from '@/components/home/FinalCta';
import { HomeFooter } from '@/components/home/HomeFooter';
import { LoginModal } from '@/components/auth/LoginModal';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): 'dark' | 'light' {
  const saved = localStorage.getItem('campusone-theme') as 'dark' | 'light' | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerSnapshot(): 'dark' | 'light' {
  return 'dark';
}

export default function HomePage() {
  const currentTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [currentTheme]);

  const toggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('campusone-theme', next);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top sticky navigation bar */}
      <HomeNavbar
        currentTheme={currentTheme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main landing composition: Radically simplified, high-personality wayfinding */}
      <main className="flex-1 flex flex-col">
        {/* 1 & 2: Hero + Compact Interactive Visual Demo */}
        <HomeHero
          currentTheme={currentTheme}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        {/* 3: Visual Problem Statement + Conceptual Campus Transit Map */}
        <CampusMapSection />

        {/* 4: Compact How It Works */}
        <HowItWorks />

        {/* 5: Official University Document Citation */}
        <InstitutionalTrust />

        {/* 6: Extremely Simple Final CTA */}
        <FinalCta />
      </main>

      {/* 7: Minimal Institutional Footer */}
      <HomeFooter currentTheme={currentTheme} />

      {/* Campus Identity & RBAC Modal */}
      <LoginModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
