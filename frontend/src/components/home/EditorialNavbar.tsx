'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { CampusOneMark } from './CampusOneMark';

export const EditorialNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#problem' },
    { label: 'FAQ', href: '#how-it-works' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-[#0E0E0E] text-white transition-all duration-200 border-b ${
        scrolled ? 'border-[#222222] shadow-lg py-2.5' : 'border-[#1C1C1F] py-3'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: CampusOne logo + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer"
          aria-label="CampusOne Home"
        >
          <div className="w-5 h-5 flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <CampusOneMark size={18} />
          </div>
          <span className="font-sans font-bold text-base tracking-tight text-white">
            CampusOne
          </span>
        </Link>

        {/* Center: Clean focused navigation */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#9E9E9E]"
        >
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-white transition-colors duration-150 py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: High-contrast White Launch Portal Button */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/workspace?role=student"
            className="inline-flex items-center gap-1.5 bg-white text-[#0E0E0E] hover:bg-[#F2EFEB] active:scale-[0.98] text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all shadow-xs cursor-pointer"
          >
            <span>Launch Portal</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0E0E0E]" />
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md focus:outline-hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[50px] bottom-0 bg-[#0E0E0E]/98 backdrop-blur-md z-40 border-t border-[#222222] p-6 flex flex-col justify-between">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-4 pt-2">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-zinc-300 hover:text-white py-2 border-b border-zinc-800 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="pb-8 pt-4">
            <Link
              href="/workspace?role=student"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#0E0E0E] hover:bg-zinc-100 text-sm font-semibold py-2.5 px-4 rounded-md transition-all shadow-md cursor-pointer"
            >
              <span>Launch Portal</span>
              <ArrowRight className="w-4 h-4 text-[#0E0E0E]" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
