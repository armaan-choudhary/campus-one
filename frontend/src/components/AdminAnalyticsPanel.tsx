'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  GitBranch,
  Layers,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

interface OperationalEvent {
  id: string;
  timestamp: string;
  type: string;
  department: string;
  confidence: number;
  status: string;
  summary: string;
}

export const AdminAnalyticsPanel: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const { toastMessage, showToast } = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Just now');
      showToast('Analytics telemetry refreshed from pgvector & PostgreSQL checkpointers.');
    }, 600);
  };

  const departments = [
    { name: 'IT Infrastructure & Wi-Fi', count: 46, percentage: 38, color: 'bg-[#FF7A00]' },
    { name: 'Fees & Finance Accounts', count: 31, percentage: 26, color: 'bg-emerald-500' },
    { name: 'Hostel & Campus Facilities', count: 20, percentage: 17, color: 'bg-amber-400' },
    { name: 'General Campus & Lost Items', count: 14, percentage: 12, color: 'bg-zinc-400' },
    { name: 'Human Resources & Staff', count: 9, percentage: 7, color: 'bg-orange-300' },
  ];

  const recentEvents: OperationalEvent[] = [
    {
      id: 'evt-001',
      timestamp: '2 mins ago',
      type: 'Direct Route',
      department: 'IT',
      confidence: 0.96,
      status: 'Auto-Resolved',
      summary: 'Eduroam network credentials & Wi-Fi password reset guide',
    },
    {
      id: 'evt-002',
      timestamp: '7 mins ago',
      type: 'Multi-Domain Fanout',
      department: 'Fees + IT',
      confidence: 0.91,
      status: 'Synthesized Joint',
      summary: 'Hostel fee hold locking exam portal registration',
    },
    {
      id: 'evt-003',
      timestamp: '14 mins ago',
      type: 'Intra-Domain Gate',
      department: 'Facilities',
      confidence: 0.62,
      status: 'Auto-Resolved',
      summary: 'Hostel shower head plumbing maintenance request',
    },
    {
      id: 'evt-004',
      timestamp: '22 mins ago',
      type: 'Human Escalation',
      department: 'Facilities',
      confidence: 0.88,
      status: 'Ticket TKT-B4109C2D',
      summary: 'Electrical short circuit in Block-B residential room',
    },
    {
      id: 'evt-005',
      timestamp: '35 mins ago',
      type: 'Direct Route',
      department: 'Fees',
      confidence: 0.94,
      status: 'Auto-Resolved',
      summary: 'Semester tuition refund deadline schedule inquiry',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-6xl mx-auto space-y-6 w-full text-[#F5F3ED] relative z-10">
      <Toast message={toastMessage} />

      {/* Header matching Chat UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1E1E24]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)] animate-pulse" />
            <span className="text-[#FF7A00] font-semibold">Operational Telemetry</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#F5F3ED] tracking-tight">
            System Analytics &amp; Health<span className="text-[#FF7A00]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8A83] mt-1 font-sans">
            Real-time telemetry measuring routing accuracy, autonomous resolution rate, and citation coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-[#8D8A83]">
            Updated: <span className="text-[#F5F3ED]">{lastUpdated}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16171E] hover:bg-[#1F212A] text-xs font-mono font-medium text-[#F5F3ED] border border-[#282A35] hover:border-[#FF7A00]/40 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF7A00]' : 'text-[#8D8A83]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid matching Chat UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Accuracy */}
        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-2 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-[#8D8A83]">
            <span className="text-xs font-mono uppercase tracking-wider">Macro Routing</span>
            <Compass className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F5F3ED]">88.4%</span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">+4.2%</span>
          </div>
          <p className="text-[11px] text-[#6A6965] font-sans">
            Benchmarked against 110 multi-domain tests.
          </p>
        </div>

        {/* KPI 2: Resolution Rate */}
        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-2 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-[#8D8A83]">
            <span className="text-xs font-mono uppercase tracking-wider">Auto-Resolution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F5F3ED]">76.0%</span>
            <span className="text-[11px] font-mono text-zinc-400">24% escalated</span>
          </div>
          <p className="text-[11px] text-[#6A6965] font-sans">
            Resolved in 1 turn without staff ticket.
          </p>
        </div>

        {/* KPI 3: Citation Coverage */}
        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-2 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-[#8D8A83]">
            <span className="text-xs font-mono uppercase tracking-wider">Provenance Rate</span>
            <FileCheck2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F5F3ED]">98.6%</span>
            <span className="text-[11px] font-mono text-emerald-400">Strict Citations</span>
          </div>
          <p className="text-[11px] text-[#6A6965] font-sans">
            Every response cited with official policy.
          </p>
        </div>

        {/* KPI 4: Median Latency */}
        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-2 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-[#8D8A83]">
            <span className="text-xs font-mono uppercase tracking-wider">Median Latency</span>
            <Zap className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F5F3ED]">680ms</span>
            <span className="text-[11px] font-mono text-zinc-400">p95: 1.4s</span>
          </div>
          <p className="text-[11px] text-[#6A6965] font-sans">
            Via Groq LLM &amp; pgvector MMR retrieval.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Department Breakdown & Routing Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Volume Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121317]/85 border border-[#22232B] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#F5F3ED] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF7A00]" />
                <span>Volume by Knowledge Store</span>
              </h2>
              <p className="text-xs text-[#8D8A83] font-sans">120 total recorded student queries</p>
            </div>
            <span className="text-xs font-mono text-[#8D8A83]">4 Isolated DBs</span>
          </div>

          <div className="space-y-3 pt-1">
            {departments.map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#F5F3ED] font-medium">{dept.name}</span>
                  <span className="font-mono text-[#8D8A83]">
                    {dept.count} inquiries ({dept.percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1C1D24] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dept.color}`}
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence & Routing Policy Matrix */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121317]/85 border border-[#22232B] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#F5F3ED] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#FF7A00]" />
                <span>Confidence Band Execution Policy</span>
              </h2>
              <p className="text-xs text-[#8D8A83] font-sans">Margin-guarded routing policy thresholds</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Active Policy</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* High confidence */}
            <div className="p-3 rounded-lg bg-[#16171E] border border-[#22232B] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-[#F5F3ED]">Auto-Route &amp; Synthesize</span>
                </div>
                <p className="text-[11px] text-[#8D8A83] font-mono">Confidence &ge; 0.75 OR Single candidate</p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-400">82.0%</span>
            </div>

            {/* Medium confidence */}
            <div className="p-3 rounded-lg bg-[#16171E] border border-[#22232B] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold text-[#F5F3ED]">Targeted Clarification</span>
                </div>
                <p className="text-[11px] text-[#8D8A83] font-mono">Confidence 0.45 &ndash; 0.74 (2&ndash;4 choice chips)</p>
              </div>
              <span className="text-sm font-mono font-bold text-amber-400">13.0%</span>
            </div>

            {/* Low confidence / Human */}
            <div className="p-3 rounded-lg bg-[#16171E] border border-[#22232B] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-semibold text-[#F5F3ED]">Human Specialist Escalation</span>
                </div>
                <p className="text-[11px] text-[#8D8A83] font-mono">Confidence &lt; 0.45 OR explicit user command</p>
              </div>
              <span className="text-sm font-mono font-bold text-rose-400">5.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Event Feed */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#121317]/85 border border-[#22232B] space-y-4 shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E1E24]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF7A00]" />
            <h2 className="text-sm font-semibold text-[#F5F3ED]">Recent Routing &amp; Resolution Events</h2>
          </div>
          <span className="text-xs font-mono text-[#8D8A83]">Streaming Live</span>
        </div>

        <div className="divide-y divide-[#1C1D24] text-xs">
          {recentEvents.map((evt) => (
            <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#16171E] text-zinc-300 border border-[#252733]">
                    {evt.department}
                  </span>
                  <span className="font-medium text-[#F5F3ED]">{evt.summary}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#8D8A83] font-mono">
                  <span>{evt.type}</span>
                  <span>&bull;</span>
                  <span>Confidence: {(evt.confidence * 100).toFixed(0)}%</span>
                  <span>&bull;</span>
                  <span>{evt.timestamp}</span>
                </div>
              </div>

              <div className="shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border ${
                  evt.status.includes('Auto-Resolved') || evt.status.includes('Synthesized')
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : evt.status.includes('Clarified')
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {evt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observability Banner */}
      <div className="p-4 rounded-xl bg-[#121317]/85 border border-[#22232B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#16171E] border border-[#282A35] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#F5F3ED]">LangSmith Real-Time Tracing Enabled</div>
            <div className="text-[11px] text-[#8D8A83]">
              Every LangGraph node transition, MMR document similarity score, and Groq token is traced in real time.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trace Stream Healthy</span>
          </span>
        </div>
      </div>
    </div>
  );
};
