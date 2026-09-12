'use client';

import React, { useState } from 'react';
import {
  ANALYTICS_SUMMARY,
  CONFUSION_MATRIX,
  LIVE_AUDIT_LOGS,
} from '@/lib/demoFixtures';
import {
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Download,
  CheckCircle2,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'semester'>('7d');
  const [selectedCell, setSelectedCell] = useState<{ actual: string; pred: string; val: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Adjust display metrics slightly per time range
  const accuracyMap = {
    '24h': { acc: '89.6%', res: '78.1%', clar: '10.4%', sess: 54 },
    '7d': { acc: '88.4%', res: '76.2%', clar: '11.8%', sess: 42 },
    '30d': { acc: '87.9%', res: '75.8%', clar: '12.3%', sess: 188 },
    semester: { acc: '88.1%', res: '76.0%', clar: '11.9%', sess: 640 },
  };

  const currentStats = accuracyMap[timeRange];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6 transition-all">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-[var(--surface-1)] border border-[var(--accent)] text-[var(--foreground)] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
                  Executive Telemetry & Evaluation
                </h2>
                <span className="text-xs font-medium text-[var(--accent)] bg-[var(--surface-2)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                  Live Observability
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] pl-0.5">
            Macro evaluation auditing margin guards (Δ ≥ 0.15), autonomous resolution rates, and confusion heatmaps
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Pills */}
          <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-full text-xs border border-[var(--border-subtle)]">
            {[
              { id: '24h', label: '24H' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'semester', label: 'Semester' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {t.label}
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
            className="flex items-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#131314] transition-colors shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards with Generous Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 flex flex-col justify-between shadow-xs space-y-3">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Routing Accuracy
          </span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {currentStats.acc}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.1% vs rule baseline</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 flex flex-col justify-between shadow-xs space-y-3">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Autonomous Resolution
          </span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {currentStats.res}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+4.3% (1,420 turns)</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 flex flex-col justify-between shadow-xs space-y-3">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Clarification Rate
          </span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {currentStats.clar}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Margin guard: 0.45 - 0.74
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 flex flex-col justify-between shadow-xs space-y-3">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Human Handoff Rate
          </span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {ANALYTICS_SUMMARY.handoffRate}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Dispatched to human triage
          </span>
        </div>

        {/* Card 5 */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 flex flex-col justify-between shadow-xs space-y-3">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Source Grounding
          </span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {ANALYTICS_SUMMARY.sourceCoverage}
            </span>
          </div>
          <span className="text-[11px] text-[var(--accent)] flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Policy Grounded
          </span>
        </div>
      </div>

      {/* Latency Strip with Generous Padding */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl px-6 py-4 flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] shadow-xs">
        <div className="flex items-center gap-6">
          <span>Latency p50: <strong className="text-[var(--foreground)] font-semibold">{ANALYTICS_SUMMARY.p50Latency}</strong></span>
          <span>Latency p95: <strong className="text-[var(--foreground)] font-semibold">{ANALYTICS_SUMMARY.p95Latency}</strong></span>
          <span>TTFT: <strong className="text-[var(--foreground)] font-semibold">1.12s</strong></span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-[var(--foreground)]">{currentStats.sess} active concurrent student sessions</span>
        </div>
      </div>

      {/* 5x5 Matrix & Live Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 5x5 Confusion Matrix */}
        <div className="lg:col-span-7 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-7 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2.5 tracking-tight">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <span>5×5 Domain Confusion Heatmap</span>
              </h3>
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">12,480 evaluated turns</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Click any cell to inspect cross-department routing ambiguity & boundary safety
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
                          col.isDiag
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

          {/* Interactive Cell Popover / Banner */}
          {selectedCell ? (
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  {selectedCell.actual} queries routed to {selectedCell.pred}: {selectedCell.val}
                </span>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-[11px] text-[var(--accent)] hover:underline"
                >
                  Clear
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {selectedCell.actual === selectedCell.pred
                  ? 'Authoritative routing alignment: high confidence classifier above the 0.85 certainty threshold.'
                  : `Disambiguation triggered: Inquiries touching both ${selectedCell.actual} and ${selectedCell.pred} prompted student clarification rather than hallucinating.`}
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <span>Confidence Margin Guard: Δ ≥ 0.15</span>
              <span className="flex items-center gap-1.5 text-[var(--accent)] font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Route Alignment</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Live Stream Turn Audit Log */}
        <div className="lg:col-span-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-7 space-y-5 shadow-xs">
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
