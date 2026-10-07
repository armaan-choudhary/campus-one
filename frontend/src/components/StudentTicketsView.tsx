'use client';

import React, { useState, useMemo } from 'react';
import { useTickets } from '@/context/TicketContext';
import { useAuth } from '@/context/AuthContext';
import { HandoffTicket } from '@/types';
import {
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Inbox,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface StudentTicketsViewProps {
  onGoToChat: () => void;
}

export const StudentTicketsView: React.FC<StudentTicketsViewProps> = ({ onGoToChat }) => {
  const {
    ongoingTickets,
    resolvedTickets,
    ongoingCount,
    resolvedCount,
    addTicket,
    refreshTickets,
    isLoading,
  } = useTickets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form State
  const [newDepartment, setNewDepartment] = useState('IT Support');
  const [newReason, setNewReason] = useState('');
  const [newUrgency, setNewUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');

  const allTickets = useMemo(() => {
    const map = new Map<string, HandoffTicket>();
    [...ongoingTickets, ...resolvedTickets].forEach((t) => map.set(t.ticketId, t));
    return Array.from(map.values());
  }, [ongoingTickets, resolvedTickets]);

  const totalCount = allTickets.length;

  const currentList = useMemo(() => {
    if (activeTab === 'all') return allTickets;
    if (activeTab === 'ongoing') return ongoingTickets;
    return resolvedTickets;
  }, [activeTab, allTickets, ongoingTickets, resolvedTickets]);

  const formatTicketDate = (val?: string) => {
    if (!val) return 'Recently';
    if (val.includes('now') || val.includes('ago')) return val;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // fallback
    }
    return val;
  };

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

    const studentDisplayName = user?.displayName ? `${user.displayName} (Student)` : (user?.email ? `${user.email} (Student)` : 'Student Requester');

    const newTicket: HandoffTicket = {
      ticketId: `#TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      department: newDepartment,
      reason: newReason.trim(),
      urgency: newUrgency,
      studentName: studentDisplayName,
      studentEmail: user?.email,
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
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0D] relative min-w-0 transition-all duration-200 text-[#F5F3ED]">
      {/* Subtle ambient warm backlight matching Chat UI */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(255,122,0,0.06),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Clean Universal Header matching Chat UI */}
      <div className="shrink-0 px-4 sm:px-8 pt-5 pb-4 border-b border-[#1E1E24] bg-[#0A0A0D]/90 backdrop-blur-md relative z-10">
        <div className="max-w-[840px] mx-auto flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA]">
              <span className="w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)] animate-pulse" />
              <span className="text-[#FF7A00] font-semibold">Incident Triage</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F3ED] tracking-tight mt-1.5">
              Escalation Case Index<span className="text-[#FF7A00]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#8D8A83] mt-1 font-sans">
              Formal inquiries dispatched to campus administration and specialist units.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshTickets()}
              disabled={isLoading}
              title="Refresh My Tickets"
              aria-label="Refresh My Tickets"
              className="p-1.5 rounded text-xs font-mono text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#1C1E26] border border-[#242531] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF7A00]' : ''}`} />
            </button>

            <button
              onClick={() => setShowNewTicketModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-[#A1A1AA] hover:text-[#FF7A00] hover:bg-[#FF7A00]/5 border border-[#242531] hover:border-[#FF7A00]/40 transition-all cursor-pointer"
            >
              <span>+ New Inquiry</span>
            </button>

            <button
              onClick={onGoToChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#FF7A00] text-black hover:bg-[#FF8A1F] font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,122,0,0.35)]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-black" />
              <span>Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Container with exact max-w-[840px] matching Chat UI */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scroll-smooth scrollbar-none relative z-10">
        <div className="max-w-[840px] mx-auto space-y-6">
          {/* Tabs and Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Minimalist Editorial Tabs */}
            <div className="flex items-center gap-6 border-b sm:border-b-0 border-[#1E1E24] pb-2 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`relative flex items-center gap-2 text-xs font-mono uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'text-[#F5F3ED] font-semibold'
                    : 'text-[#8D8A83] hover:text-[#F5F3ED]'
                }`}
              >
                <span>All Cases</span>
                <span className="text-[10px] text-[#A1A1AA] font-mono font-bold">[{totalCount}]</span>
                {activeTab === 'all' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FF7A00]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('ongoing')}
                className={`relative flex items-center gap-2 text-xs font-mono uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                  activeTab === 'ongoing'
                    ? 'text-[#F5F3ED] font-semibold'
                    : 'text-[#8D8A83] hover:text-[#F5F3ED]'
                }`}
              >
                <span>Open Cases</span>
                <span className="text-[10px] text-[#FF7A00] font-mono font-bold">[{ongoingCount}]</span>
                {activeTab === 'ongoing' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FF7A00]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('resolved')}
                className={`relative flex items-center gap-2 text-xs font-mono uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                  activeTab === 'resolved'
                    ? 'text-[#F5F3ED] font-semibold'
                    : 'text-[#8D8A83] hover:text-[#F5F3ED]'
                }`}
              >
                <span>Resolved</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">[{resolvedCount}]</span>
                {activeTab === 'resolved' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-400" />
                )}
              </button>
            </div>

            {/* Search Box matching MessageComposer style */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8A83] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search index by ID or keyword..."
                className="w-full bg-[#121317]/85 border border-[#22232B] focus:border-[#FF7A00]/60 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-[#F5F3ED] placeholder:text-[#6A6965] focus:outline-hidden transition-all font-mono"
              />
            </div>
          </div>

          {/* Ticket Card Stack */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="p-8 sm:p-12 text-center rounded-xl bg-[#121317]/85 border border-[#22232B] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#16171E] border border-[#242531] text-[#8D8A83] flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6 stroke-1" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <div className="font-mono text-xs text-[#FF7A00] uppercase tracking-wider">
                    — {activeTab === 'ongoing' ? 'NO OPEN ESCALATIONS' : activeTab === 'resolved' ? 'NO RESOLVED CASES' : 'NO INQUIRIES LOGGED'} {'//'}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#F5F3ED]">
                    {activeTab === 'ongoing'
                      ? 'All student matters are clear'
                      : activeTab === 'resolved'
                      ? 'Historical resolutions cataloged here'
                      : 'No support inquiries recorded'}
                  </h3>
                  <p className="text-xs text-[#8D8A83] leading-relaxed font-sans pt-1">
                    {activeTab === 'ongoing'
                      ? (resolvedCount > 0
                          ? `You have ${resolvedCount} resolved case${resolvedCount === 1 ? '' : 's'} available in your historical archive.`
                          : 'Standard campus questions are grounded and answered immediately by CampusOne without escalation.')
                      : activeTab === 'resolved'
                      ? 'Resolved tickets from administrative departments will remain accessible here for your records.'
                      : 'Inquiries raised directly with specialist units or escalated via chat will be indexed here.'}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  {activeTab === 'ongoing' && resolvedCount > 0 && (
                    <button
                      onClick={() => setActiveTab('resolved')}
                      className="inline-flex items-center gap-1.5 text-xs font-mono px-3.5 py-1.5 rounded-lg bg-[#16171E] border border-[#2D303E] hover:border-emerald-500/50 text-[#F5F3ED] transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View {resolvedCount} Resolved {resolvedCount === 1 ? 'Case' : 'Cases'}</span>
                    </button>
                  )}
                  <button
                    onClick={onGoToChat}
                    className="inline-flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 rounded-lg bg-[#FF7A00] text-black hover:bg-[#FF8A1F] font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,122,0,0.35)]"
                  >
                    <span>Ask CampusOne</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isResolved = ticket.status === 'resolved';

                return (
                  <div
                    key={ticket.ticketId}
                    className="group relative p-4 sm:p-5 rounded-xl bg-[#121317]/85 hover:bg-[#15161E] border border-[#22232B] hover:border-[#FF7A00]/50 transition-all duration-200 shadow-md hover:shadow-[0_4px_24px_rgba(255,122,0,0.08)] space-y-3 overflow-hidden"
                  >
                    {/* Faint orange hover top-edge sheen matching Chat UI */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Header Row: ID, Department, Status, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#F5F3ED] tracking-wider">
                          {ticket.ticketId}
                        </span>

                        <span className="font-mono text-[11px] text-[#8D8A83] uppercase">
                          — {ticket.department} {'//'}
                        </span>

                        {/* Status Marker */}
                        {isResolved ? (
                          <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>RESOLVED</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-[#FF7A00] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
                            <span>{ticket.urgency === 'urgent' ? 'URGENT REVIEW' : 'PENDING'}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-[#8D8A83] font-mono">
                        {formatTicketDate(ticket.createdAt)}
                      </span>
                    </div>

                    {/* Reason & Quotation */}
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

                    {/* Resolution Note if resolved */}
                    {isResolved && ticket.resolutionNote && (
                      <div className="p-3 rounded-lg bg-[#0E1015] border border-emerald-500/25 space-y-1 text-xs">
                        <div className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Resolution Note from Staff:</span>
                        </div>
                        <p className="text-[#F5F3ED] leading-relaxed">
                          {ticket.resolutionNote}
                        </p>
                      </div>
                    )}

                    {/* Footer metadata */}
                    <div className="flex items-center justify-between text-xs text-[#8D8A83] font-mono pt-2 border-t border-[#1C1D24] group-hover:border-[#FF7A00]/25 transition-colors">
                      <span>Queue: {ticket.department}</span>
                      {ticket.assignedTo && (
                        <span>Assigned: {ticket.assignedTo}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Manual Support Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#111216] border border-[#22232B] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-[#F5F3ED] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#FF7A00]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manual Escalation Dispatch</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F5F3ED] mt-0.5">
                  Submit Direct Work Order
                </h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 rounded-md text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#1C1E26] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8D8A83] uppercase">
                  Target Department
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 rounded-xl px-3.5 py-2 text-xs text-[#F5F3ED] focus:outline-hidden"
                >
                  <option value="IT Support">IT Support &amp; Network Services</option>
                  <option value="Student Accounts & Finance">Student Accounts &amp; Bursar</option>
                  <option value="Campus Facilities">Campus Facilities &amp; Housing Maintenance</option>
                  <option value="Academic Services">Academic Services &amp; Registrar</option>
                  <option value="Campus Administration">Campus Administration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8D8A83] uppercase">
                  Urgency Level
                </label>
                <select
                  value={newUrgency}
                  onChange={(e) => setNewUrgency(e.target.value as 'normal' | 'high' | 'urgent')}
                  className="w-full bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 rounded-xl px-3.5 py-2 text-xs text-[#F5F3ED] focus:outline-hidden"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Operational Escalation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8D8A83] uppercase">
                  Inquiry Summary / Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Describe your issue or what assistance is required..."
                  className="w-full bg-[#0E0F13] border border-[#22232B] focus:border-[#FF7A00]/60 rounded-xl p-3 text-xs text-[#F5F3ED] placeholder:text-[#6A6965] focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1E1E24]">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#8D8A83] hover:text-white hover:bg-[#1C1E26] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-mono bg-[#FF7A00] text-black hover:bg-[#FF8A1F] font-bold cursor-pointer shadow-[0_0_12px_rgba(255,122,0,0.35)]"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
