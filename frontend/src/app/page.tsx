'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { HomeNavbar } from '@/components/home/HomeNavbar';
import { HomeHero } from '@/components/home/HomeHero';
import { CapabilitiesSection } from '@/components/home/CapabilitiesSection';
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

      {/* Main landing sections */}
      <main className="flex-1 flex flex-col">
        <HomeHero
          currentTheme={currentTheme}
          onOpenAuth={() => setShowAuthModal(true)}
        />
        <CapabilitiesSection />
      </main>

      {/* Institutional footer */}
      <HomeFooter currentTheme={currentTheme} />

      {/* Campus Identity & RBAC Modal (Portaled cleanly to document.body) */}
      <LoginModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
