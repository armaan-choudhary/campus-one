'use client';

import React, { useState } from 'react';
import { useTickets } from '@/context/TicketContext';
import { useAuth } from '@/context/AuthContext';
import { fetchQuickRepliesApi } from '@/lib/api';
import { HandoffTicket } from '@/types';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import {
  Clock,
  AlertTriangle,
  Search,
  Check,
  X,
  Inbox,
  Sparkles,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const AdminTicketPanel: React.FC = () => {
  const { tickets, updateTicketStatus, refreshTickets, isLoading } = useTickets();
  const { accessToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resolvingTicket, setResolvingTicket] = useState<HandoffTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [aiTemplates, setAiTemplates] = useState<string[]>([]);
  const [isLoadingAiTemplates, setIsLoadingAiTemplates] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const { toastMessage, showToast } = useToast();

  const totalCount = tickets.length;
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const filteredTickets = tickets.filter((t) => {
    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    // Department filter
    if (departmentFilter !== 'all') {
      const dep = t.department.toLowerCase();
      if (departmentFilter === 'it' && !dep.includes('it')) return false;
      if (departmentFilter === 'finance' && !dep.includes('finance') && !dep.includes('account')) return false;
      if (departmentFilter === 'facilities' && !dep.includes('facilities') && !dep.includes('hostel')) return false;
      if (departmentFilter === 'academics' && !dep.includes('acad') && !dep.includes('course')) return false;
      if (departmentFilter === 'administration' && !dep.includes('admin') && !dep.includes('affair')) return false;
    }

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const match =
        t.ticketId.toLowerCase().includes(q) ||
        (t.studentName && t.studentName.toLowerCase().includes(q)) ||
        t.department.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q) ||
        (t.preview && t.preview.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleClaim = (ticketId: string) => {
    updateTicketStatus(ticketId, 'in_progress', undefined, 'System Administrator');
    showToast(`Ticket ${ticketId} claimed and assigned to your admin workstation.`);
  };

  const loadTemplates = async (ticket: HandoffTicket) => {
    setIsLoadingAiTemplates(true);
    try {
      const res = await fetchQuickRepliesApi(
        accessToken || '',
        ticket.department,
        ticket.reason,
        ticket.preview,
        'ticket_resolution'
      );
      setAiTemplates(res.templates);
      setAiSource(res.source);
    } catch {
      setAiTemplates([
        `Verified with ${ticket.department} office. Action completed and recorded.`,
        `Work order dispatched to ${ticket.department} operational team.`,
        `Student profile and service configuration refreshed.`,
      ]);
      setAiSource('client_fallback');
    } finally {
      setIsLoadingAiTemplates(false);
    }
  };

  const handleOpenResolveModal = (ticket: HandoffTicket) => {
    setResolvingTicket(ticket);
    setResolutionNote(
      `Issue reviewed and verified by Central Administration. Resolution has been logged in the campus directory.`
    );
    loadTemplates(ticket);
  };

  const handleQuickTemplate = (template: string) => {
    setResolutionNote(template);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    updateTicketStatus(
      resolvingTicket.ticketId,
      'resolved',
      resolutionNote.trim(),
      'System Administrator'
    );
    showToast(`Ticket ${resolvingTicket.ticketId} marked resolved. Resolution note sent to student.`);
    setResolvingTicket(null);
    setResolutionNote('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-6xl mx-auto space-y-6 w-full text-[#F5F3ED] relative z-10">
      <Toast message={toastMessage} />

      {/* Admin Panel Header matching Chat UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1E1E24]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)] animate-pulse" />
            <span className="text-[#FF7A00] font-semibold">Staff Triage Console</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#F5F3ED] tracking-tight">
            Incident Escalation Dispatch<span className="text-[#FF7A00]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8A83] mt-1 font-sans">
            Centralized queue to review, claim, and resolve escalated campus support work orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshTickets()}
            disabled={isLoading}
            title="Refresh Escalation Queue"
            aria-label="Refresh Escalation Queue"
            className="p-2 rounded-lg bg-[#121317]/85 border border-[#22232B] hover:border-[#FF7A00]/40 text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF7A00]' : ''}`} />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121317]/85 border border-[#22232B] text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Relay Active</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview Cards matching Chat UI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-mono text-[#8D8A83] uppercase tracking-wider block">Total Inquiries</span>
          <div className="text-2xl font-bold font-mono text-[#F5F3ED]">{totalCount}</div>
          <span className="text-[11px] text-[#6A6965] font-mono">All queues combined</span>
        </div>

        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-mono text-[#FF7A00] uppercase tracking-wider block">Pending Review</span>
          <div className="text-2xl font-bold font-mono text-[#FF7A00]">{pendingCount}</div>
          <span className="text-[11px] text-[#6A6965] font-mono">Awaiting staff claim</span>
        </div>

        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider block">In Progress</span>
          <div className="text-2xl font-bold font-mono text-amber-300">{inProgressCount}</div>
          <span className="text-[11px] text-[#6A6965] font-mono">Being handled</span>
        </div>

        <div className="group relative p-4 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 shadow-md space-y-1 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">Resolved</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{resolvedCount}</div>
          <span className="text-[11px] text-[#6A6965] font-mono">Closed &amp; confirmed</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3 p-4 rounded-xl bg-[#121317]/85 border border-[#22232B] shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all' as const, label: 'All Statuses', count: totalCount },
                { id: 'pending' as const, label: 'Pending', count: pendingCount },
                { id: 'in_progress' as const, label: 'In Progress', count: inProgressCount },
                { id: 'resolved' as const, label: 'Resolved', count: resolvedCount },
              ]
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/30 font-semibold shadow-xs'
                    : 'bg-[#16171E] text-[#8D8A83] border border-[#22232B] hover:text-[#F5F3ED] hover:border-[#353844]'
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[10px] opacity-80 font-mono">({st.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8A83] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, student, reason..."
              className="w-full bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-[#F5F3ED] placeholder:text-[#6A6965] focus:outline-hidden transition-all font-mono"
            />
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[#1C1D24] text-xs">
          <span className="text-[11px] font-mono text-[#8D8A83] mr-1">Department:</span>
          {[
            { id: 'all', label: 'All Departments' },
            { id: 'it', label: 'IT Support' },
            { id: 'finance', label: 'Finance & Accounts' },
            { id: 'facilities', label: 'Facilities & Housing' },
            { id: 'academics', label: 'Academics & Registrar' },
            { id: 'administration', label: 'Administration' },
          ].map((dept) => (
            <button
              key={dept.id}
              onClick={() => setDepartmentFilter(dept.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer border ${
                departmentFilter === dept.id
                  ? 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/30 font-semibold'
                  : 'bg-[#16171E] text-[#8D8A83] border-[#22232B] hover:text-[#F5F3ED]'
              }`}
            >
              <span>{dept.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center bg-[#121317]/85 rounded-xl border border-[#22232B] space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#16171E] border border-[#22232B] flex items-center justify-center mx-auto text-[#8D8A83]">
              <Inbox className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-sm font-semibold text-[#F5F3ED]">No tickets match active filters</h3>
            <p className="text-xs text-[#8D8A83] max-w-sm mx-auto">
              There are currently no tickets matching your status, department, or keyword search criteria.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'resolved';
            const isInProgress = ticket.status === 'in_progress';

            return (
              <div
                key={ticket.ticketId}
                className="group relative p-5 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/40 transition-all duration-200 space-y-3.5 shadow-md overflow-hidden"
              >
                {/* Faint orange hover top-edge sheen */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Top Info Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Ticket ID in monospace */}
                    <span className="font-mono text-sm font-bold text-[#F5F3ED]">
                      {ticket.ticketId}
                    </span>

                    {/* Domain pill */}
                    <span className="font-mono text-[11px] text-[#8D8A83] uppercase">
                      — {ticket.department} {'//'}
                    </span>

                    {/* Status Badge */}
                    {isResolved ? (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>RESOLVED</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                        <span>IN PROGRESS</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[#FF7A00] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
                        <span>PENDING REVIEW</span>
                      </span>
                    )}

                    {/* Urgency */}
                    {ticket.urgency === 'urgent' && (
                      <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-2.5 h-2.5" /> Urgent
                      </span>
                    )}
                    {ticket.urgency === 'high' && (
                      <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-mono">
                        High Priority
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#8D8A83] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.createdAt}
                  </span>
                </div>

                {/* Student Inquiry Quote in Serif */}
                <div className="space-y-1">
                  <h3 className="font-serif text-base sm:text-lg text-[#F5F3ED] leading-snug">
                    &ldquo;{ticket.reason}&rdquo;
                  </h3>
                  {ticket.preview && ticket.preview !== ticket.reason && (
                    <p className="text-xs text-[#8D8A83] leading-relaxed font-sans pt-0.5">
                      {ticket.preview}
                    </p>
                  )}
                </div>

                {/* Requester & Telemetry Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 font-mono text-[#8D8A83]">
                  <div>
                    Requester: <span className="text-[#F5F3ED] font-semibold">{ticket.studentName || ticket.studentEmail || 'Student Requester'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                    <span>Auto-routed &bull; Queue: {ticket.department}</span>
                  </div>
                </div>

                {/* Resolution note display if resolved */}
                {isResolved && ticket.resolutionNote && (
                  <div className="p-3 rounded-lg bg-[#0E1015] border border-emerald-500/25 space-y-1 text-xs">
                    <div className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Resolution Logged by Staff:</span>
                    </div>
                    <p className="text-[#F5F3ED] leading-relaxed">
                      {ticket.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1C1D24] group-hover:border-[#FF7A00]/25 transition-colors">
                  <div className="text-xs text-[#8D8A83] font-mono">
                    {ticket.assignedTo ? `Assigned: ${ticket.assignedTo}` : 'Unassigned'}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isResolved && (
                      <>
                        {!isInProgress && (
                          <button
                            onClick={() => handleClaim(ticket.ticketId)}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#16171E] hover:bg-[#1F212A] text-[#F5F3ED] border border-[#282A35] hover:border-[#FF7A00]/40 transition-colors cursor-pointer"
                          >
                            Claim Ticket
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenResolveModal(ticket)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#FF7A00] text-black hover:bg-[#FF8A1F] shadow-[0_0_12px_rgba(255,122,0,0.3)] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-black" />
                          <span>Resolve &amp; Notify Student</span>
                        </button>
                      </>
                    )}

                    {isResolved && (
                      <button
                        onClick={() => updateTicketStatus(ticket.ticketId, 'in_progress', undefined, 'System Administrator')}
                        className="px-3 py-1 rounded-lg text-xs font-mono text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#16171E] border border-transparent hover:border-[#282A33] transition-colors cursor-pointer"
                      >
                        Re-open Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Ticket Modal with Quick Templates */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#111216] border border-[#22232B] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-[#F5F3ED] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
              <div>
                <span className="text-xs font-mono text-[#FF7A00] font-bold">
                  {resolvingTicket.ticketId}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#F5F3ED] mt-0.5">
                  Resolve Ticket &amp; Notify Student<span className="text-[#FF7A00]">.</span>
                </h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="p-1 rounded-md text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#1C1E26] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Reply Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8D8A83] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                    AI Quick-Reply Templates
                  </span>
                  {aiSource && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border border-[#FF7A00]/30 bg-[#FF7A00]/10 text-[#FF7A00]">
                      {aiSource === 'llm' ? 'AI-Generated' : 'Department Preset'}
                    </span>
                  )}
                </div>
                {resolvingTicket && (
                  <button
                    type="button"
                    onClick={() => loadTemplates(resolvingTicket)}
                    disabled={isLoadingAiTemplates}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingAiTemplates ? 'animate-spin text-[#FF7A00]' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>

              {isLoadingAiTemplates ? (
                <div className="flex items-center justify-center py-4 rounded-xl bg-[#0E0F13] border border-[#22232B] text-[#8D8A83] text-xs gap-2 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00]" />
                  <span>Synthesizing contextual resolution templates...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(aiTemplates.length > 0
                    ? aiTemplates
                    : [
                        `Verified with ${resolvingTicket?.department || 'Registrar'}. Official updated records transmitted.`,
                        `Work order dispatched to ${resolvingTicket?.department || 'Facilities'} Maintenance team.`,
                        'Network port recalibrated and student credential refreshed.',
                      ]
                  ).map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickTemplate(tmpl)}
                      className="text-left text-xs p-2.5 rounded-lg bg-[#16171E] hover:bg-[#1C1E28] text-[#F5F3ED] border border-[#242533] hover:border-[#FF7A00]/40 transition-colors cursor-pointer flex items-start gap-2 group"
                    >
                      <Sparkles className="w-3 h-3 text-[#FF7A00]/70 group-hover:text-[#FF7A00] mt-0.5 shrink-0" />
                      <span className="font-sans leading-relaxed">&ldquo;{tmpl}&rdquo;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8D8A83] uppercase">
                  Resolution Explanation / Staff Action Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain the solution or administrative action taken..."
                  className="w-full bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 rounded-xl p-3 text-xs text-[#F5F3ED] placeholder:text-[#6A6965] focus:outline-hidden resize-none font-sans leading-relaxed"
                />
                <span className="text-[11px] text-[#8D8A83] block font-mono">
                  Attached to ticket and visible on student&apos;s case dashboard.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1E1E24]">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#8D8A83] hover:bg-[#1C1E26] hover:text-[#F5F3ED] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-mono bg-[#FF7A00] text-black hover:bg-[#FF8A1F] font-bold cursor-pointer shadow-[0_0_12px_rgba(255,122,0,0.35)] flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Confirm &amp; Close Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
