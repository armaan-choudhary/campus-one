'use client';

import React, { useState } from 'react';
import { AGENT_TICKETS, HandoffTicket } from '@/lib/demoFixtures';
import {
  Inbox,
  AlertTriangle,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  X,
  User,
  Search,
  ShieldCheck,
  Send,
  MessageSquare,
  Bot,
} from 'lucide-react';

export const AgentQueueView: React.FC = () => {
  const [tickets, setTickets] = useState<HandoffTicket[]>(AGENT_TICKETS);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<HandoffTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [showToast, setShowToast] = useState<string | null>(null);

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'it'
        ? t.department.toLowerCase().includes('it')
        : filter === 'finance'
        ? t.department.toLowerCase().includes('finance') || t.department.toLowerCase().includes('accounts')
        : filter === 'facilities'
        ? t.department.toLowerCase().includes('facilities')
        : filter === 'registrar'
        ? t.department.toLowerCase().includes('registrar') || t.department.toLowerCase().includes('admin')
        : true;

    const matchesSearch =
      t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.studentName && t.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.preview && t.preview.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleClaim = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === ticketId ? { ...t, status: 'in_progress' } : t
      )
    );
    if (selectedTicket?.ticketId === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
    }
    triggerToast(`Ticket ${ticketId} claimed and assigned to your workstation.`);
  };

  const handleResolve = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === ticketId ? { ...t, status: 'resolved' } : t
      )
    );
    if (selectedTicket?.ticketId === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    }
    triggerToast(`Ticket ${ticketId} marked resolved. Resolution notification sent to student.`);
  };

  const rawTemplates = [
    'Dear {{studentName}}, your inquiry for ticket {{ticketId}} has been resolved in the institutional directory. Access is restored.',
    'Work order dispatched to campus facility engineering for ticket {{ticketId}}. Estimated on-site arrival: 30 minutes.',
    'Bursar payment ledger verified against bank UTR for {{studentName}}. Academic registration hold cleared on portal.',
  ];

  const applyTemplate = (tmpl: string) => {
    if (!selectedTicket) return;
    const interpolated = tmpl
      .replace(/\{\{studentName\}\}/g, selectedTicket.studentName || 'Student')
      .replace(/\{\{ticketId\}\}/g, selectedTicket.ticketId);
    setResolutionNote(interpolated);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-[1440px] mx-auto space-y-6 transition-all">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[var(--surface-1)] border border-[var(--accent)] text-[var(--foreground)] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-medium">{showToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shadow-xs">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] tracking-tight">
                  Support Specialist Queue
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Triage
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] pl-0.5">
            Pre-packaged escalations dispatched by CampusOne with complete conversational context &amp; grounding
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets, students..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-10 pr-4 py-2.5 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Queue Performance Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Active Escalations</span>
          <div className="text-2xl font-bold text-[var(--foreground)] tracking-tight font-mono">{tickets.length}</div>
          <span className="text-[11px] text-[var(--accent)] font-medium">All campus areas</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Urgent Priority</span>
          <div className="text-2xl font-bold text-red-500 tracking-tight font-mono">
            {tickets.filter((t) => t.urgency === 'urgent').length}
          </div>
          <span className="text-[11px] text-red-400 font-medium">15 min SLA window</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">In Triage / Claimed</span>
          <div className="text-2xl font-bold text-[var(--accent)] tracking-tight font-mono">
            {tickets.filter((t) => t.status === 'in_progress').length}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)]">Specialist reviewing</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Resolved Today</span>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
            {tickets.filter((t) => t.status === 'resolved').length}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">100% on SLA</span>
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Tickets', count: tickets.length },
          { id: 'it', label: 'IT Helpdesk', count: tickets.filter((t) => t.department.toLowerCase().includes('it')).length },
          { id: 'finance', label: 'Finance & Accounts', count: tickets.filter((t) => t.department.toLowerCase().includes('finance') || t.department.toLowerCase().includes('accounts')).length },
          { id: 'facilities', label: 'Facilities', count: tickets.filter((t) => t.department.toLowerCase().includes('facilities')).length },
          { id: 'registrar', label: 'Registrar', count: tickets.filter((t) => t.department.toLowerCase().includes('registrar') || t.department.toLowerCase().includes('admin')).length },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              filter === item.id
                ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm font-semibold'
                : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] border border-[var(--border-subtle)]'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                filter === item.id
                  ? 'bg-[var(--background)] text-[var(--foreground)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface-1)] rounded-3xl border border-[var(--border-subtle)]">
            No tickets match your active filter.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.ticketId}
              className="p-6 sm:p-7 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all flex flex-col justify-between gap-5 shadow-xs hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Top Row: Ticket ID, Urgency, Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold font-mono text-[var(--accent)]">
                      {ticket.ticketId}
                    </span>
                    {ticket.urgency === 'urgent' && (
                      <span className="text-[10.5px] uppercase font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-red-500/20">
                        <AlertTriangle className="w-3 h-3" /> Urgent (12m left)
                      </span>
                    )}
                    {ticket.urgency === 'high' && (
                      <span className="text-[10.5px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        High Priority
                      </span>
                    )}
                    {ticket.urgency === 'normal' && (
                      <span className="text-[10.5px] uppercase font-medium text-[var(--text-secondary)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)]">
                        Normal
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.createdAt}
                  </span>
                </div>

                {/* Student & Department Info */}
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--accent)]" />
                    <span>{ticket.studentName}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 pl-6">
                    <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>{ticket.department}</span>
                  </div>
                </div>

                {/* Reason Code Pill */}
                <div className="text-xs font-medium text-[var(--foreground)] bg-[var(--surface-2)] p-3.5 rounded-2xl border border-[var(--border-subtle)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] block mb-1 font-mono">
                    Routing Disambiguation Reason
                  </span>
                  <span className="leading-snug">{ticket.reason}</span>
                </div>

                {/* Preview Quote Block */}
                <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                    &ldquo;{ticket.preview}&rdquo;
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    ticket.status === 'resolved'
                      ? 'text-emerald-400'
                      : ticket.status === 'in_progress'
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {ticket.status === 'in_progress'
                    ? 'In Triage'
                    : ticket.status === 'resolved'
                    ? 'Resolved'
                    : 'Pending Pickup'}
                </span>

                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResolutionNote('');
                  }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] px-4 py-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors border border-[var(--border-subtle)] shadow-xs cursor-pointer"
                >
                  <span>Inspect Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--accent)]">
                  {selectedTicket.ticketId}
                </span>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mt-0.5 tracking-tight">
                  Triage Escalation Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block">Student Name</span>
                  <span className="font-semibold text-sm text-[var(--foreground)] mt-0.5 block">{selectedTicket.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block">Escalated Department</span>
                  <span className="font-semibold text-sm text-[var(--foreground)] mt-0.5 block">{selectedTicket.department}</span>
                </div>
              </div>

              {/* Pre-Escalation Chat Transcript */}
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block mb-1.5">
                  Pre-Escalation Student &amp; AI Dialogue Turns
                </span>
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] text-[var(--foreground)] leading-relaxed space-y-3 border border-[var(--border-subtle)]">
                  <div className="flex items-start gap-2 text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[11px] block">{selectedTicket.studentName}:</span>
                      <p className="text-[var(--text-secondary)] italic">&ldquo;{selectedTicket.preview}&rdquo;</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs pt-2 border-t border-[var(--border-subtle)]/60">
                    <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[11px] block">CampusOne Orchestrator:</span>
                      <p className="text-[var(--text-secondary)]">
                        No authoritative evidence was found in the published handbook. Rather than hallucinating, inquiry was auto-routed to human specialists with reason: <strong>{selectedTicket.reason}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] font-medium pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AI Context Lock: Full turn history verified &amp; token-budgeted.</span>
                  </div>
                </div>
              </div>

              {/* Quick Resolution Templates */}
              {selectedTicket.status !== 'resolved' && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block">
                    One-Click Resolution Templates (Auto-Interpolated)
                  </span>
                  <div className="space-y-1.5">
                    {rawTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyTemplate(template)}
                        className="w-full text-left p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--foreground)] transition-colors border border-[var(--border-subtle)] cursor-pointer"
                      >
                        {template
                          .replace(/\{\{studentName\}\}/g, selectedTicket.studentName || 'Student')
                          .replace(/\{\{ticketId\}\}/g, selectedTicket.ticketId)}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block mb-1">
                      Resolution Note to Student
                    </label>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Add custom notes or click a template above..."
                      rows={2}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-2xl p-3 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              {selectedTicket.status !== 'resolved' ? (
                <>
                  <button
                    onClick={() => handleClaim(selectedTicket.ticketId)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors cursor-pointer shadow-xs"
                  >
                    Claim Ownership
                  </button>
                  <button
                    onClick={() => handleResolve(selectedTicket.ticketId)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#131314] transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Resolve &amp; Notify</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Ticket resolved &amp; closed
                  </span>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
