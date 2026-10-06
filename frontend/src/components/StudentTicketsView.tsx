'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTickets } from '@/context/TicketContext';
import { HandoffTicket } from '@/types';
import {
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  X,
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-5xl mx-auto space-y-6 w-full text-[#F5F3ED]">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#292929]">
        <div>
          <div className="font-mono text-xs text-[#8D8A83] tracking-widest uppercase mb-1">
            — MY TICKETS //
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#F5F3ED]">
            Escalation Case Index
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8A83] mt-1 font-sans">
            Formal inquiries dispatched to campus administration and specialist units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-1.5 text-xs font-mono px-3.5 py-1.5 rounded-md bg-[#151515] hover:bg-[#1A1A1A] text-[#F5F3ED] border border-[#292929] hover:border-[#FF7A00] transition-colors cursor-pointer"
          >
            <span>+ New Inquiry</span>
          </button>

          <button
            onClick={onGoToChat}
            className="flex items-center gap-1.5 text-xs font-mono px-3.5 py-1.5 rounded-md bg-[#F5F3ED] text-black hover:bg-white transition-colors cursor-pointer font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Simple Editorial Text Tabs */}
        <div className="flex items-center gap-6 border-b sm:border-b-0 border-[#292929] pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider pb-1 transition-all cursor-pointer ${
              activeTab === 'ongoing'
                ? 'text-[#FF7A00] border-b-2 border-[#FF7A00] font-semibold'
                : 'text-[#8D8A83] hover:text-[#F5F3ED]'
            }`}
          >
            <span>Open Cases</span>
            <span className="text-[10px] text-[#8D8A83]">[{ongoingCount}]</span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider pb-1 transition-all cursor-pointer ${
              activeTab === 'resolved'
                ? 'text-[#FF7A00] border-b-2 border-[#FF7A00] font-semibold'
                : 'text-[#8D8A83] hover:text-[#F5F3ED]'
            }`}
          >
            <span>Resolved</span>
            <span className="text-[10px] text-[#8D8A83]">[{resolvedCount}]</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8A83] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search index by ID or keyword..."
            className="w-full bg-[#111111] border border-[#292929] focus:border-[#FF7A00] rounded-md pl-9 pr-3.5 py-1.5 text-xs text-[#F5F3ED] placeholder:text-[#8D8A83] focus:outline-none transition-colors font-mono"
          />
        </div>
      </div>

      {/* Ticket List as Editorial Case Index */}
      <div className="border border-[#292929] rounded-lg bg-[#111111] divide-y divide-[#292929] overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="relative w-28 h-28 mx-auto opacity-75">
              <Image
                src="/illustrations/wimpy/finance-dark.webp"
                alt="Editorial student"
                fill
                sizes="112px"
                className="object-contain pointer-events-none select-none"
              />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <div className="font-mono text-xs text-[#8D8A83] uppercase tracking-wider">
                — {activeTab === 'ongoing' ? 'NO OPEN ESCALATIONS' : 'NO RESOLVED CASES'} {'//'}
              </div>
              <h3 className="font-serif text-base text-[#F5F3ED]">
                {activeTab === 'ongoing' ? 'All student matters are currently clear.' : 'Historical resolutions will be cataloged here.'}
              </h3>
              <p className="text-xs text-[#8D8A83] leading-relaxed font-sans pt-1">
                {activeTab === 'ongoing'
                  ? 'Standard campus questions are grounded and answered immediately by CampusOne without escalation.'
                  : 'Resolved tickets from administrative departments will remain accessible for reference.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onGoToChat}
                className="inline-flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 rounded-md bg-[#151515] hover:bg-[#1A1A1A] text-[#F5F3ED] border border-[#292929] hover:border-[#FF7A00] transition-colors cursor-pointer"
              >
                <span>Ask CampusOne</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF7A00]" />
              </button>
            </div>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'resolved';

            return (
              <div
                key={ticket.ticketId}
                className="p-5 sm:p-6 hover:bg-[#151515] transition-colors space-y-3"
              >
                {/* Header row: ID, Domain, Status, Timestamp */}
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
                      <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                        ● RESOLVED
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-[#FF7A00] flex items-center gap-1">
                        ● {ticket.urgency === 'urgent' ? 'URGENT REVIEW' : 'PENDING'}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#8D8A83] font-mono">
                    {ticket.createdAt}
                  </span>
                </div>

                {/* Reason & Quotation */}
                <div className="space-y-1">
                  <h3 className="font-serif text-base sm:text-lg text-[#F5F3ED] leading-snug">
                    &ldquo;{ticket.reason}&rdquo;
                  </h3>
                  {ticket.preview && ticket.preview !== ticket.reason && (
                    <p className="text-xs text-[#8D8A83] leading-relaxed font-sans pt-1">
                      {ticket.preview}
                    </p>
                  )}
                </div>

                {/* Resolution Note if resolved */}
                {isResolved && ticket.resolutionNote && (
                  <div className="p-3.5 rounded-md bg-[#151515] border border-[#292929] space-y-1 text-xs">
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
                <div className="flex items-center justify-between text-xs text-[#8D8A83] font-mono pt-1">
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

      {/* Manual Support Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#111111] border border-[#292929] rounded-xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-[#F5F3ED]">
            <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
              <div>
                <div className="font-mono text-xs text-[#8D8A83] uppercase tracking-wider">
                  — NEW INQUIRY //
                </div>
                <h3 className="font-serif text-lg font-medium text-[#F5F3ED] mt-0.5">
                  Submit Direct Work Order
                </h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 rounded text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#151515]"
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
                  className="w-full bg-[#151515] border border-[#292929] rounded-md px-3.5 py-2 text-xs text-[#F5F3ED] focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value="IT Support">IT Support & Network Services</option>
                  <option value="Student Accounts & Finance">Student Accounts & Bursar</option>
                  <option value="Campus Facilities">Campus Facilities & Housing Maintenance</option>
                  <option value="Academic Services">Academic Services & Registrar</option>
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
                  className="w-full bg-[#151515] border border-[#292929] rounded-md px-3.5 py-2 text-xs text-[#F5F3ED] focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent (Immediate Assistance)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8D8A83] uppercase">
                  Inquiry / Issue Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  className="w-full bg-[#151515] border border-[#292929] rounded-md p-3 text-xs text-[#F5F3ED] placeholder:text-[#8D8A83] focus:outline-none focus:border-[#FF7A00] resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-md text-xs font-mono text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md text-xs font-mono bg-[#FF7A00] text-black font-bold hover:bg-[#FF8F26] transition-colors cursor-pointer"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

