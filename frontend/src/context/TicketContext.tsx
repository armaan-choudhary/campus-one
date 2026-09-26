'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { HandoffTicket } from '@/types';

interface TicketContextType {
  tickets: HandoffTicket[];
  ongoingTickets: HandoffTicket[];
  resolvedTickets: HandoffTicket[];
  ongoingCount: number;
  resolvedCount: number;
  addTicket: (ticket: HandoffTicket) => void;
  updateTicketStatus: (
    ticketId: string,
    status: 'pending' | 'in_progress' | 'resolved',
    note?: string,
    assignedTo?: string
  ) => void;
  deleteTicket: (ticketId: string) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

const TICKETS_STORAGE_KEY = 'campusone_tickets_store';

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<HandoffTicket[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tickets from storage', e);
    }
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to persist tickets to storage', e);
    }
  }, [tickets]);

  const addTicket = useCallback((newTicket: HandoffTicket) => {
    setTickets((prev) => {
      // Prevent duplicates by ticketId
      const exists = prev.some((t) => t.ticketId === newTicket.ticketId);
      if (exists) {
        return prev.map((t) => (t.ticketId === newTicket.ticketId ? { ...t, ...newTicket } : t));
      }
      return [
        {
          ...newTicket,
          status: newTicket.status || 'pending',
          createdAt: newTicket.createdAt || 'Just now',
        },
        ...prev,
      ];
    });
  }, []);

  const updateTicketStatus = useCallback(
    (
      ticketId: string,
      status: 'pending' | 'in_progress' | 'resolved',
      note?: string,
      assignedTo?: string
    ) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.ticketId === ticketId) {
            return {
              ...t,
              status,
              ...(note ? { resolutionNote: note } : {}),
              ...(status === 'resolved' ? { resolvedAt: 'Just now' } : {}),
              ...(assignedTo ? { assignedTo } : {}),
            };
          }
          return t;
        })
      );
    },
    []
  );

  const deleteTicket = useCallback((ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
  }, []);

  const ongoingTickets = useMemo(
    () => tickets.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [tickets]
  );

  const resolvedTickets = useMemo(
    () => tickets.filter((t) => t.status === 'resolved'),
    [tickets]
  );

  const value = useMemo(
    () => ({
      tickets,
      ongoingTickets,
      resolvedTickets,
      ongoingCount: ongoingTickets.length,
      resolvedCount: resolvedTickets.length,
      addTicket,
      updateTicketStatus,
      deleteTicket,
    }),
    [tickets, ongoingTickets, resolvedTickets, addTicket, updateTicketStatus, deleteTicket]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}
