'use client';

import React, { useState } from 'react';
import { useTickets } from '@/context/TicketContext';
import { HandoffTicket } from '@/types';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Search,
  Check,
  X,
  Send,
  MessageSquare,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';

export const AdminTicketPanel: React.FC = () => {
  const { tickets, updateTicketStatus } = useTickets();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resolvingTicket, setResolvingTicket] = useState<HandoffTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
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

  const handleOpenResolveModal = (ticket: HandoffTicket) => {
    setResolvingTicket(ticket);
    setResolutionNote(
      `Issue reviewed and verified by Central Administration. Resolution has been logged in the campus directory.`
    );
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-6xl mx-auto space-y-6 w-full">
      <Toast message={toastMessage} />

      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] tracking-tight">
              Admin Ticket Management Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Centralized queue to review, claim, and resolve all escalated campus support work orders.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Queue Feed</span>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1 shadow-xs">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Total Tickets</span>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)]">{totalCount}</div>
          <span className="text-[10.5px] text-[var(--text-tertiary)]">All campus submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1 shadow-xs">
          <span className="text-[11px] font-medium text-amber-400">Pending Review</span>
          <div className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</div>
          <span className="text-[10.5px] text-[var(--text-tertiary)]">Awaiting specialist claim</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1 shadow-xs">
          <span className="text-[11px] font-medium text-blue-400">In Progress</span>
          <div className="text-2xl font-bold font-mono text-blue-400">{inProgressCount}</div>
          <span className="text-[10.5px] text-[var(--text-tertiary)]">Currently being handled</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-400">Resolved</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{resolvedCount}</div>
          <span className="text-[10.5px] text-[var(--text-tertiary)]">Closed with student feedback</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3 p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Statuses', count: totalCount },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'in_progress', label: 'In Progress', count: inProgressCount },
              { id: 'resolved', label: 'Resolved', count: resolvedCount },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)]'
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[10px] opacity-80 font-mono">({st.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, student, reason..."
              className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]/60 text-xs">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] mr-1">Department:</span>
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
              className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                departmentFilter === dept.id
                  ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center bg-[var(--surface-1)] rounded-3xl border border-[var(--border-subtle)] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
              <Inbox className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">No tickets match active filters</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
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
                className="p-5 sm:p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all space-y-4 shadow-xs"
              >
                {/* Top Info Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-[var(--accent)]">
                      {ticket.ticketId}
                    </span>

                    {/* Status */}
                    {isResolved ? (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    )}

                    {/* Urgency */}
                    {ticket.urgency === 'urgent' && (
                      <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Urgent
                      </span>
                    )}
                    {ticket.urgency === 'high' && (
                      <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        High Priority
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.createdAt}
                  </span>
                </div>

                {/* Student & Department Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <User className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span>Requester: {ticket.studentName || 'Anonymous Student'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                    <span>Department: <strong>{ticket.department}</strong></span>
                  </div>
                </div>

                {/* Reason & Content Preview */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">{ticket.reason}</h4>
                  {ticket.preview && ticket.preview !== ticket.reason && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-2)]/60 p-3.5 rounded-xl border border-[var(--border-subtle)]">
                      {ticket.preview}
                    </p>
                  )}
                </div>

                {/* Resolution note display if resolved */}
                {isResolved && ticket.resolutionNote && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                    <span className="font-semibold text-emerald-400">Resolution Logged:</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {ticket.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-tertiary)] font-mono">
                    {ticket.assignedTo ? `Assigned: ${ticket.assignedTo}` : 'Unassigned'}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isResolved && (
                      <>
                        {!isInProgress && (
                          <button
                            onClick={() => handleClaim(ticket.ticketId)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                          >
                            Claim Ticket
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenResolveModal(ticket)}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve Ticket</span>
                        </button>
                      </>
                    )}

                    {isResolved && (
                      <button
                        onClick={() => updateTicketStatus(ticket.ticketId, 'in_progress', undefined, 'System Administrator')}
                        className="px-3 py-1 rounded-full text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Ticket Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-xs font-mono text-[var(--accent)] font-bold">
                  {resolvingTicket.ticketId}
                </span>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Resolve Ticket &amp; Notify Student
                </h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Resolution Explanation / Staff Action Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain the solution or administrative action taken..."
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:border-[var(--accent)] resize-none"
                />
                <span className="text-[11px] text-[var(--text-tertiary)] block">
                  This note will be permanently attached to the ticket and visible on the student&apos;s ticket dashboard.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
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
