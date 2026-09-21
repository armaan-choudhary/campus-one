'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const FinalCta: React.FC = () => {
  return (
    <section className="py-24 lg:py-36 px-4 sm:px-8 lg:px-12 bg-[var(--background)] border-b border-[var(--border-subtle)] text-center">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
          Your campus has dozens of offices. <br />
          <span className="font-serif italic font-normal text-[var(--foreground)] block pt-2 text-2xl sm:text-4xl lg:text-5xl text-[var(--text-secondary)]">
            Students need one front door.
          </span>
        </h2>

        <div className="pt-2">
          <Link
            href="/workspace?role=student"
            className="inline-flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] px-6 py-3 rounded text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <span>Ask CampusOne</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
