'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { CampusOneMark } from './CampusOneMark';
import { CampusWayfindingSign, DepartmentKey } from './CampusWayfindingSign';

interface ProblemScenario {
  id: string;
  problem: string;
  activeDepts: DepartmentKey[];
  resolution: string;
}

const SCENARIOS: ProblemScenario[] = [
  {
    id: 'missed-exam',
    problem: '“I need to appeal my missed exam and protect my aid.”',
    activeDepts: ['registrar', 'bursar'],
    resolution: 'Coordinated §7.2 medical makeup exam with Registrar + Title IV aid freeze with Bursar.',
  },
  {
    id: 'medical-withdraw',
    problem: '“I need to withdraw mid-semester for a medical emergency.”',
    activeDepts: ['registrar', 'bursar', 'housing'],
    resolution: 'Retroactive drop petition (Registrar) + prorated tuition credit (Bursar) + housing contract release (Housing).',
  },
  {
    id: 'midnight-lockout',
    problem: '“Locked out of my dorm room and student portal on registration night.”',
    activeDepts: ['it', 'housing'],
    resolution: 'Immediate MFA token reset (IT) + residential duty phone dispatch (Housing).',
  },
];

export const CampusMapSection: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState('missed-exam');

  const currentScenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const isRegistrar = currentScenario.activeDepts.includes('registrar');
  const isBursar = currentScenario.activeDepts.includes('bursar');
  const isIT = currentScenario.activeDepts.includes('it');
  const isHousing = currentScenario.activeDepts.includes('housing');

  return (
    <section id="campus-map" className="py-20 lg:py-28 px-4 sm:px-8 lg:px-12 bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Visual Statement: Students don't think in departments. They think in problems. */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <CampusOneMark size={12} className="text-indigo-400" />
            <span className="uppercase tracking-wider font-semibold text-[var(--foreground)]">CAMPUS DIRECTORY</span>
            <span className="text-[var(--text-tertiary)]">&bull;</span>
            <span>TRANSIT MAP</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-[1.08]">
            Students don&rsquo;t think in departments. <br />
            <span className="font-serif italic font-normal text-[var(--foreground)] block pt-1 text-2xl sm:text-4xl lg:text-5xl text-[var(--text-secondary)]">
              They think in problems.
            </span>
          </h2>
        </div>

        {/* Problem Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
          <span className="text-[11px] text-[var(--text-tertiary)] mr-1 uppercase tracking-wider">
            Incoming Problem:
          </span>
          {SCENARIOS.map((sc) => {
            const isSelected = sc.id === activeScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveScenarioId(sc.id)}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer border text-left text-xs ${
                  isSelected
                    ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] font-semibold shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border-subtle)]'
                }`}
              >
                {sc.problem}
              </button>
            );
          })}
        </div>

        {/* Conceptual Transit Map / Campus Directory */}
        <div className="w-full rounded border border-[var(--border-subtle)] bg-[var(--background)] p-6 sm:p-10 relative overflow-hidden font-mono">
          {/* Background Wayfinding Gridlines */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Compass / Wayfinding Marker */}
          <div className="absolute top-4 right-4 text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>CENTRAL QUAD SCHEMATIC</span>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center space-y-4 sm:space-y-6">
            {/* NORTH: Registrar (Academic) */}
            <div className="w-full max-w-sm">
              <CampusWayfindingSign
                deptKey="registrar"
                code="REGISTRAR &bull; 01"
                name="Office of the Registrar"
                building="BLDG 04 &bull; FLOOR 2"
                scope="Academic records &bull; Exam petitions &sect;7.2"
                room="RM 214"
                isActive={isRegistrar}
              />
            </div>

            {/* Vertical Connector Line North */}
            <div className="w-px h-6 sm:h-8 transition-colors duration-300 relative">
              <div
                className={`w-full h-full ${
                  isRegistrar ? 'bg-blue-400' : 'bg-[var(--border-medium)]'
                }`}
              />
              {isRegistrar && (
                <span className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              )}
            </div>

            {/* WEST — CAMPUSONE CENTER — EAST */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* WEST: IT Services */}
              <div className="md:col-span-4 order-2 md:order-1">
                <CampusWayfindingSign
                  deptKey="it"
                  code="IT SERVICES &bull; 07"
                  name="Computing & Access"
                  building="BLDG 07 &bull; SUITE 110"
                  scope="MFA auth &bull; Portal tokens"
                  room="RM 110"
                  isActive={isIT}
                />
              </div>

              {/* CENTER: CampusOne Hub */}
              <div className="md:col-span-4 order-1 md:order-2 flex flex-col items-center justify-center p-4 rounded bg-[var(--surface-1)] border border-indigo-500/50 shadow-xs text-center">
                <div className="w-7 h-7 rounded bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center mb-2 shadow-xs">
                  <CampusOneMark size={15} />
                </div>
                <div className="text-xs font-bold text-[var(--foreground)]">
                  CAMPUSONE
                </div>
                <div className="text-[10px] text-indigo-400 uppercase tracking-wider mt-0.5 font-semibold">
                  FRONT DOOR
                </div>
                <div className="text-[9px] text-[var(--text-tertiary)] mt-1">
                  TRANSIT NODE 01
                </div>
              </div>

              {/* EAST: Bursar */}
              <div className="md:col-span-4 order-3">
                <CampusWayfindingSign
                  deptKey="bursar"
                  code="BURSAR &bull; 04"
                  name="Bursar & Financial Aid"
                  building="BLDG 04 &bull; GROUND"
                  scope="Title IV holds &bull; Refunds"
                  room="RM 102"
                  isActive={isBursar}
                />
              </div>
            </div>

            {/* Vertical Connector Line South */}
            <div className="w-px h-6 sm:h-8 transition-colors duration-300 relative">
              <div
                className={`w-full h-full ${
                  isHousing ? 'bg-emerald-400' : 'bg-[var(--border-medium)]'
                }`}
              />
              {isHousing && (
                <span className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            {/* SOUTH: Residential Life */}
            <div className="w-full max-w-sm">
              <CampusWayfindingSign
                deptKey="housing"
                code="HOUSING &bull; 02"
                name="Residential Life"
                building="BLDG 02 &bull; NORTH QUAD"
                scope="Dorm swaps &bull; Room contracts"
                room="RM 101"
                isActive={isHousing}
              />
            </div>
          </div>

          {/* Bottom Wayfinding Resolution Bar */}
          <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[var(--foreground)] font-medium">
                {currentScenario.resolution}
              </span>
            </div>

            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider shrink-0">
              {currentScenario.activeDepts.length} Offices Coordinated
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
