'use client';

import React, { useState } from 'react';
import { useTickets } from '@/context/TicketContext';
import { HandoffTicket } from '@/types';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  X,
  Send,
} from 'lucide-react';

interface StudentTicketsViewProps {
  onGoToChat: () => void;
}

export const StudentTicketsView: React.FC<StudentTicketsViewProps> = ({ onGoToChat }) => {
  const { ongoingTickets, resolvedTickets, ongoingCount, resolvedCount, addTicket } = useTickets();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'resolved'>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form State
  const [newDepartment, setNewDepartment] = useState('IT Support');
  const [newReason, setNewReason] = useState('');
  const [newUrgency, setNewUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');

  const currentList = activeTab === 'ongoing' ? ongoingTickets : resolvedTickets;

  const filteredTickets = currentList.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.ticketId.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      (t.preview && t.preview.toLowerCase().includes(q))
    );
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;

    const newTicket: HandoffTicket = {
      ticketId: `#TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      department: newDepartment,
      reason: newReason.trim(),
      urgency: newUrgency,
      studentName: 'Alex Rivera (Student)',
      createdAt: 'Just now',
      status: 'pending',
      preview: newReason.trim(),
    };

    addTicket(newTicket);
    setNewReason('');
    setShowNewTicketModal(false);
    setActiveTab('ongoing');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-5xl mx-auto space-y-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] border border-[var(--border-subtle)]">
              <Ticket className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] tracking-tight">
              My Campus Tickets
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Track escalation work orders and support requests dispatched to campus departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Open Ticket</span>
          </button>

          <button
            onClick={onGoToChat}
            className="flex items-center gap-1.5 text-xs font-semibold px-4.5 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] transition-colors cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Assistant</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sub-Tabs: Ongoing vs Resolved */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-full w-fit">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Ongoing Tickets</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                activeTab === 'ongoing'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-[var(--surface-3)] text-[var(--text-tertiary)]'
              }`}
            >
              {ongoingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-[var(--surface-1)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resolved</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                activeTab === 'resolved'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-[var(--surface-3)] text-[var(--text-tertiary)]'
              }`}
            >
              {resolvedCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID or keyword..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="space-y-3.5">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-[var(--surface-1)] rounded-3xl border border-[var(--border-subtle)] space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
              <Ticket className="w-6 h-6 stroke-1" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {activeTab === 'ongoing' ? 'No ongoing tickets' : 'No resolved tickets yet'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeTab === 'ongoing'
                  ? 'You do not have any open escalations. Questions you ask the assistant are resolved automatically.'
                  : 'When campus administrators or specialists resolve your escalated requests, they will appear here.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onGoToChat}
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
              >
                <span>Ask the campus assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'resolved';
            const isInProgress = ticket.status === 'in_progress';

            return (
              <div
                key={ticket.ticketId}
                className="p-5 sm:p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all space-y-4 shadow-xs hover:shadow-md"
              >
                {/* Header row: ID, Urgency, Status, Time */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-[var(--accent)]">
                      {ticket.ticketId}
                    </span>

                    {/* Status Badge */}
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
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

                {/* Reason & Details */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">{ticket.reason}</h4>
                  {ticket.preview && ticket.preview !== ticket.reason && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-2)]/60 p-3 rounded-xl border border-[var(--border-subtle)]">
                      {ticket.preview}
                    </p>
                  )}
                </div>

                {/* Resolution Note if resolved */}
                {isResolved && ticket.resolutionNote && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1 text-xs">
                    <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Resolution Note from Staff:</span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed pl-5">
                      {ticket.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Footer: Department & Assignment */}
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]/70">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Department: <strong>{ticket.department}</strong></span>
                  </div>

                  {ticket.assignedTo && (
                    <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                      Assigned: {ticket.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Support Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Submit Direct Support Ticket
                </h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Target Department
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                >
                  <option value="IT Support">IT Support & Network Services</option>
                  <option value="Student Accounts & Finance">Student Accounts & Bursar</option>
                  <option value="Campus Facilities">Campus Facilities & Housing Maintenance</option>
                  <option value="Academic Services">Academic Services & Registrar</option>
                  <option value="Campus Administration">Campus Administration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Urgency Level
                </label>
                <select
                  value={newUrgency}
                  onChange={(e) => setNewUrgency(e.target.value as 'normal' | 'high' | 'urgent')}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent (Immediate Assistance)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Inquiry / Issue Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:border-[var(--accent)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] shadow-xs transition-colors cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
