'use client';

import React, { useState, useEffect } from 'react';
import {
  ANALYTICS_SUMMARY,
  CONFUSION_MATRIX,
  LIVE_AUDIT_LOGS,
} from '@/lib/demoFixtures';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import {
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Download,
  BarChart2,
  X,
  FileCheck,
} from 'lucide-react';

interface DiagnosticPrompt {
  query: string;
  actual: string;
  pred: string;
  confidence: number;
  deltaMargin: number;
  outcome: string;
}

const SAMPLE_DIAGNOSTICS: Record<string, DiagnosticPrompt[]> = {
  'IT-Finance': [
    {
      query: 'Where do I pay for my replacement RFID student identity card?',
      actual: 'IT',
      pred: 'Finance',
      confidence: 0.58,
      deltaMargin: 0.06,
      outcome: 'Targeted Disambiguation Triggered (IT vs Finance)',
    },
    {
      query: 'Student portal login fee receipt missing from dashboard',
      actual: 'IT',
      pred: 'Finance',
      confidence: 0.52,
      deltaMargin: 0.04,
      outcome: 'Clarification Dialog Prompted',
    },
  ],
  'Facilities-IT': [
    {
      query: 'Lab 402 smart projector ethernet wall jack is dead and power LED is red',
      actual: 'Facilities',
      pred: 'IT',
      confidence: 0.61,
      deltaMargin: 0.08,
      outcome: 'Routed to Facilities with IT Co-Notification',
    },
  ],
  'Finance-Finance': [
    {
      query: 'When does late semester tuition fee surcharge kick in for Fall 2026?',
      actual: 'Finance',
      pred: 'Finance',
      confidence: 0.97,
      deltaMargin: 0.42,
      outcome: 'Direct Grounded Answer with §3.2 Citation',
    },
    {
      query: 'How to verify bank UTR transfer clearance in SIS ledger',
      actual: 'Finance',
      pred: 'Finance',
      confidence: 0.94,
      deltaMargin: 0.38,
      outcome: 'Direct Grounded Answer with Action Checklist',
    },
  ],
};

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'semester'>('7d');
  const [selectedCell, setSelectedCell] = useState<{ actual: string; pred: string; val: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toastMessage, showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCell) {
        setSelectedCell(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Live telemetry streams re-synchronized with edge evaluation logs.');
    }, 900);
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Timestamp,SessionId,PredictedDomain,Confidence,Latency,Status\n' +
      LIVE_AUDIT_LOGS.map(
        (l) => `${l.time},${l.session},${l.domain},${l.confidence},${l.latency},"${l.status}"`
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusone_telemetry_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Telemetry report exported as campusone_telemetry_${timeRange}.csv`);
  };

  const accuracyMap = {
    '24h': { acc: '89.6%', res: '78.1%', clar: '10.4%', sess: 54 },
    '7d': { acc: '88.4%', res: '76.2%', clar: '11.8%', sess: 42 },
    '30d': { acc: '87.9%', res: '75.8%', clar: '12.3%', sess: 188 },
    semester: { acc: '88.1%', res: '76.0%', clar: '11.9%', sess: 640 },
  };

  const currentStats = accuracyMap[timeRange];

  const getDiagnosticCases = () => {
    if (!selectedCell) return [];
    const key = `${selectedCell.actual}-${selectedCell.pred}`;
    if (SAMPLE_DIAGNOSTICS[key]) return SAMPLE_DIAGNOSTICS[key];
    if (selectedCell.actual === selectedCell.pred) {
      return [
        {
          query: `Sample authoritative ${selectedCell.actual} inquiry passing Δ ≥ 0.15 threshold`,
          actual: selectedCell.actual,
          pred: selectedCell.pred,
          confidence: 0.95,
          deltaMargin: 0.35,
          outcome: 'Direct Grounded Answer with Evidence Citation',
        },
      ];
    }
    return [
      {
        query: `Cross-boundary query spanning ${selectedCell.actual} policy and ${selectedCell.pred} processes`,
        actual: selectedCell.actual,
        pred: selectedCell.pred,
        confidence: 0.54,
        deltaMargin: 0.07,
        outcome: 'Disambiguation Prompted to Student',
      },
    ];
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-[1440px] mx-auto space-y-6 transition-all">
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Header & Filter Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] tracking-tight">
                  Executive Telemetry &amp; Evaluation
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Observability
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] pl-0.5">
            Macro evaluation auditing margin guards (&Delta; &ge; 0.15), autonomous resolution rates, and confusion heatmaps
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Time Range Pills */}
          <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-full text-xs border border-[var(--border-subtle)]">
            {(['24h', '7d', '30d', 'semester'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  timeRange === t
                    ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] transition-colors shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards with Quality Gate Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-5 flex flex-col justify-between shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Routing Accuracy</span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              PASS
            </span>
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {currentStats.acc}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between border-t border-[var(--border-subtle)]/60 pt-2">
            <span>Target: &ge; 85.0%</span>
            <span className="text-[var(--accent)] flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +3.4%
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-5 flex flex-col justify-between shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Autonomous Resolution</span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              PASS
            </span>
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {currentStats.res}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between border-t border-[var(--border-subtle)]/60 pt-2">
            <span>Target: &ge; 75.0%</span>
            <span className="text-[var(--accent)] flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +1.2%
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-5 flex flex-col justify-between shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Clarification Rate</span>
            <span className="text-[10px] font-semibold text-[var(--accent)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] font-mono">
              SAFE
            </span>
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {currentStats.clar}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)]/60 pt-2">
            <span>Margin Guard: 0.45 &ndash; 0.74</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-5 flex flex-col justify-between shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Human Handoff Rate</span>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] font-mono">
              TRIAGE
            </span>
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {ANALYTICS_SUMMARY.handoffRate}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)]/60 pt-2">
            <span>Dispatched to Specialist Queue</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-5 flex flex-col justify-between shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Source Grounding</span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              0% HALLUC
            </span>
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {ANALYTICS_SUMMARY.sourceCoverage}
            </span>
          </div>
          <div className="text-[11px] text-[var(--accent)] flex items-center gap-1 font-medium border-t border-[var(--border-subtle)]/60 pt-2 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Policy Grounded
          </div>
        </div>
      </div>

      {/* Latency Strip */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl px-6 py-4 flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] shadow-xs">
        <div className="flex items-center gap-6">
          <span>Latency p50: <strong className="text-[var(--foreground)] font-semibold font-mono">{ANALYTICS_SUMMARY.p50Latency}</strong></span>
          <span>Latency p95: <strong className="text-[var(--foreground)] font-semibold font-mono">{ANALYTICS_SUMMARY.p95Latency}</strong></span>
          <span>TTFT: <strong className="text-[var(--foreground)] font-semibold font-mono">1.12s</strong></span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-[var(--foreground)]">{currentStats.sess} active concurrent student sessions</span>
        </div>
      </div>

      {/* 5x5 Matrix & Live Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 5x5 Confusion Matrix */}
        <div className="lg:col-span-7 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs relative">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2.5 tracking-tight">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <span>5&times;5 Domain Confusion Heatmap</span>
              </h3>
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">12,480 evaluated turns</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Click any cell to open interactive query routing diagnostic drill-down
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] font-mono text-[11px]">
                  <th className="py-3 text-left font-semibold uppercase">Actual \ Pred</th>
                  <th className="py-3 px-3 uppercase">IT</th>
                  <th className="py-3 px-3 uppercase">Finance</th>
                  <th className="py-3 px-3 uppercase">Facilities</th>
                  <th className="py-3 px-3 uppercase">Academics</th>
                  <th className="py-3 px-3 uppercase">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]/50">
                {CONFUSION_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                    <td className="py-3.5 text-left font-semibold text-[var(--foreground)]">
                      {row.actual}
                    </td>
                    {[
                      { key: 'IT', val: row.it, isDiag: idx === 0 },
                      { key: 'Finance', val: row.fin, isDiag: idx === 1 },
                      { key: 'Facilities', val: row.fac, isDiag: idx === 2 },
                      { key: 'Academics', val: row.acad, isDiag: idx === 3 },
                      { key: 'Admin', val: row.admin, isDiag: idx === 4 },
                    ].map((col, cIdx) => (
                      <td
                        key={cIdx}
                        onClick={() => setSelectedCell({ actual: row.actual, pred: col.key, val: col.val })}
                        className={`py-3.5 px-3 rounded-xl cursor-pointer transition-all ${
                          selectedCell?.actual === row.actual && selectedCell?.pred === col.key
                            ? 'ring-2 ring-[var(--accent)] bg-[var(--surface-2)] font-bold'
                            : col.isDiag
                            ? 'bg-[var(--surface-2)] text-[var(--accent)] font-bold shadow-xs'
                            : parseFloat(col.val) > 2
                            ? 'text-amber-400 font-medium hover:bg-[var(--surface-2)]'
                            : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        {col.val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Cell Diagnostic Banner */}
          {selectedCell ? (
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
                  <FileCheck className="w-4 h-4 text-[var(--accent)]" />
                  <span>
                    Diagnostic Case: Actual {selectedCell.actual} &rarr; Pred {selectedCell.pred} ({selectedCell.val})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--foreground)] p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {getDiagnosticCases().map((c, cIdx) => (
                  <div key={cIdx} className="p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[var(--foreground)]">&ldquo;{c.query}&rdquo;</span>
                      <span className="font-mono text-[var(--accent)] font-semibold">
                        &Delta; Margin: {c.deltaMargin}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-[var(--text-secondary)]">
                      <span>Outcome: <strong className="text-[var(--foreground)]">{c.outcome}</strong></span>
                      <span className="font-mono">Conf: {(c.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <span>Confidence Margin Guard: &Delta; &ge; 0.15</span>
              <span className="flex items-center gap-1.5 text-[var(--accent)] font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Route Alignment</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Live Stream Turn Audit Log */}
        <div className="lg:col-span-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2.5 tracking-tight">
              <Activity className="w-4 h-4 text-[var(--accent)]" />
              <span>Real-Time Ingestion Feed</span>
            </h3>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full font-mono font-medium">
              Live Stream
            </span>
          </div>

          <div className="space-y-3">
            {LIVE_AUDIT_LOGS.map((log, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[var(--surface-2)] text-xs flex flex-col gap-2 shadow-xs border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold font-mono text-[var(--accent)]">{log.session}</span>
                  <span className="text-[var(--text-tertiary)] font-mono">{log.time}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--foreground)]">
                  <span className="font-medium">{log.domain}</span>
                  <span className="text-[11px] text-[var(--text-secondary)] bg-[var(--surface-1)] px-2.5 py-0.5 rounded-full font-mono">
                    {log.latency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] pt-1.5 border-t border-[var(--border-subtle)]">
                  <span>Confidence: {(parseFloat(log.confidence) * 100).toFixed(0)}%</span>
                  <span className="text-[var(--foreground)] font-medium">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
