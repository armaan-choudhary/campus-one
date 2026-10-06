'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTickets } from '@/context/TicketContext';
import { useAuth } from '@/context/AuthContext';
import { fetchQuickRepliesApi } from '@/lib/api';
import { HandoffTicket } from '@/types';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Check,
  X,
  Inbox,
  Sparkles,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { HandwrittenNote, OrangeTicks } from '@/components/home/HandwrittenElements';

export const AdminTicketPanel: React.FC = () => {
  const { tickets, updateTicketStatus } = useTickets();
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-6xl mx-auto space-y-6 w-full text-white">
      <Toast message={toastMessage} />

      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#23242A]">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#8E8F94] uppercase mb-1">
            <span className="text-[#F97316] font-bold text-sm">—</span>
            <span>INCIDENT TRIAGE &amp; ESCALATION CONSOLE</span>
            <OrangeTicks count={2} />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            Human staff escalation <span className="italic font-normal">dispatch</span>.
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8F94] mt-1">
            Centralized queue to review, claim, and resolve all escalated campus support work orders.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16171D] border border-[#252730] text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Relay Active</span>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#121316] border border-[#23242A] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-[#8E8F94] uppercase tracking-wider">Total Tickets</span>
          <div className="text-2xl font-bold font-mono text-white">{totalCount}</div>
          <span className="text-[10.5px] text-[#666666]">All campus submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121316] border border-[#23242A] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</div>
          <span className="text-[10.5px] text-[#666666]">Awaiting staff claim</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121316] border border-[#23242A] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-bold font-mono text-blue-400">{inProgressCount}</div>
          <span className="text-[10.5px] text-[#666666]">Currently being handled</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121316] border border-[#23242A] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Resolved</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{resolvedCount}</div>
          <span className="text-[10.5px] text-[#666666]">Closed with student feedback</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3 p-4 rounded-2xl bg-[#121316] border border-[#23242A] shadow-xs">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#1C1E26] text-white border border-[#3F4350] shadow-xs font-semibold'
                    : 'bg-[#16171D] text-[#A1A1AA] border border-[#252730] hover:text-white hover:border-[#353844]'
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[10px] opacity-80 font-mono">({st.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, student, reason..."
              className="w-full bg-[#1A1C22] border border-[#282A33] focus:border-[#3F4350] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-[#666666] focus:outline-hidden transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1C1E26] text-xs">
          <span className="text-[11px] font-mono text-[#8E8F94] mr-1">Department:</span>
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
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer border ${
                departmentFilter === dept.id
                  ? 'bg-[#1C1E26] text-white border-[#3F4350]'
                  : 'bg-[#16171D] text-[#A1A1AA] border-[#252730] hover:text-white hover:border-[#353844]'
              }`}
            >
              <span className="w-0.5 h-2 bg-[#38BDF8] rounded-full inline-block" />
              <span>{dept.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="py-14 text-center bg-[#121316] rounded-2xl border border-[#23242A] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#18191E] border border-[#282A33] flex items-center justify-center mx-auto text-[#8E8F94]">
              <Inbox className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-sm font-semibold text-white">No tickets match active filters</h3>
            <p className="text-xs text-[#8E8F94] max-w-sm mx-auto">
              There are currently no tickets matching your status, department, or keyword search criteria.
            </p>
            <div className="pt-2 pointer-events-none">
              <HandwrittenNote
                text="All campus queues clear!\nNo pending work orders."
                arrowDirection="curve-down"
                color="#D4D4D8"
                textSize="text-xs sm:text-sm"
              />
            </div>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'resolved';
            const isInProgress = ticket.status === 'in_progress';

            return (
              <div
                key={ticket.ticketId}
                className="p-5 sm:p-6 rounded-2xl bg-[#121316] border border-[#23242A] hover:border-[#3F4350] transition-all space-y-4 shadow-xs"
              >
                {/* Top Info Row per Section 7 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Ticket ID in monospace */}
                    <span className="font-mono text-sm font-bold text-white">
                      {ticket.ticketId}
                    </span>

                    {/* Domain pill with cyan indicator bar */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border bg-[#1C1E26] text-white border-[#3F4350]">
                      <span className="w-0.5 h-2.5 bg-[#38BDF8] rounded-full inline-block" />
                      <span>{ticket.department}</span>
                    </span>

                    {/* Status Badge */}
                    {isResolved ? (
                      <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[11px] font-mono font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    )}

                    {/* Urgency */}
                    {ticket.urgency === 'urgent' && (
                      <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-2.5 h-2.5" /> Urgent
                      </span>
                    )}
                    {ticket.urgency === 'high' && (
                      <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                        High Priority
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#8E8F94] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.createdAt}
                  </span>
                </div>

                {/* Student Inquiry Quote in Serif per Section 7 */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#18191E] border border-[#282A33] space-y-1.5">
                  <div className="font-serif italic text-sm sm:text-base text-zinc-100">
                    &ldquo;{ticket.reason}&rdquo;
                  </div>
                  {ticket.preview && ticket.preview !== ticket.reason && (
                    <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans pt-1">
                      {ticket.preview}
                    </p>
                  )}
                </div>

                {/* Requester & Telemetry Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-[#3F4350] flex items-center justify-center shrink-0 relative">
                      <Image
                        src="/illustrations/wimpy/avatar-1.png"
                        alt="Student"
                        fill
                        sizes="20px"
                        className="object-contain"
                      />
                    </div>
                    <span>Requester: <strong>{ticket.studentName || 'Student Alex Rivera'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[#8E8F94] font-mono text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                    <span>Auto-routed &bull; 98% confidence &bull; Queue: {ticket.department}</span>
                  </div>
                </div>

                {/* Resolution note display if resolved */}
                {isResolved && ticket.resolutionNote && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <span className="font-semibold text-emerald-400 font-mono">Resolution Logged by Staff:</span>
                    <p className="text-zinc-200 leading-relaxed">
                      {ticket.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Actions Bar per Section 7 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#23242A]">
                  <div className="text-xs text-[#8E8F94] font-mono">
                    {ticket.assignedTo ? `Assigned: ${ticket.assignedTo}` : 'Unassigned'}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isResolved && (
                      <>
                        {!isInProgress && (
                          <button
                            onClick={() => handleClaim(ticket.ticketId)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1C1E26] hover:bg-[#272932] text-white border border-[#3F4350] transition-colors cursor-pointer active:scale-95"
                          >
                            Claim Ticket
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenResolveModal(ticket)}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve &amp; Notify Student</span>
                        </button>
                      </>
                    )}

                    {isResolved && (
                      <button
                        onClick={() => updateTicketStatus(ticket.ticketId, 'in_progress', undefined, 'System Administrator')}
                        className="px-3 py-1 rounded-xl text-xs text-[#8E8F94] hover:text-white hover:bg-[#1C1E26] border border-transparent hover:border-[#282A33] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#121316] border border-[#23242A] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#23242A]">
              <div>
                <span className="text-xs font-mono text-[#38BDF8] font-bold">
                  {resolvingTicket.ticketId}
                </span>
                <h3 className="text-base font-semibold text-white">
                  Resolve Ticket &amp; Notify Student
                </h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="p-1 rounded-md hover:bg-[#1C1E26] text-[#8E8F94] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Reply Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E8F94] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    AI Quick-Reply Templates
                  </span>
                  {aiSource && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      {aiSource === 'llm' ? 'AI-Generated' : 'Department Preset'}
                    </span>
                  )}
                </div>
                {resolvingTicket && (
                  <button
                    type="button"
                    onClick={() => loadTemplates(resolvingTicket)}
                    disabled={isLoadingAiTemplates}
                    className="flex items-center gap-1 text-[11px] text-[#8E8F94] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingAiTemplates ? 'animate-spin text-amber-400' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>

              {isLoadingAiTemplates ? (
                <div className="flex items-center justify-center py-4 rounded-lg bg-[#18191E] border border-[#282A33] text-zinc-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
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
                      className="text-left text-xs p-2.5 rounded-lg bg-[#18191E] hover:bg-[#1C1E26] text-zinc-300 hover:text-white border border-[#282A33] hover:border-amber-500/40 transition-colors cursor-pointer flex items-start gap-2 group"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400/60 group-hover:text-amber-400 mt-0.5 shrink-0" />
                      <span>&ldquo;{tmpl}&rdquo;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-200">
                  Resolution Explanation / Staff Action Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain the solution or administrative action taken..."
                  className="w-full bg-[#1A1C22] border border-[#282A33] rounded-xl p-3 text-xs text-white placeholder:text-[#666666] focus:outline-hidden focus:border-[#3F4350] resize-none"
                />
                <span className="text-[11px] text-[#8E8F94] block">
                  This note will be permanently attached to the ticket and visible on the student&apos;s ticket dashboard.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#8E8F94] hover:bg-[#1C1E26] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
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

