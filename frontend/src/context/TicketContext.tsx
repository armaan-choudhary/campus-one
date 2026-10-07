'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { HandoffTicket } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  fetchTicketsApi,
  createTicketApi,
  updateTicketStatusApi,
  deleteTicketApi,
} from '@/lib/api';

interface TicketContextType {
  tickets: HandoffTicket[];
  ongoingTickets: HandoffTicket[];
  resolvedTickets: HandoffTicket[];
  ongoingCount: number;
  resolvedCount: number;
  isLoading: boolean;
  addTicket: (ticket: HandoffTicket) => Promise<void>;
  updateTicketStatus: (
    ticketId: string,
    status: 'pending' | 'in_progress' | 'resolved',
    note?: string,
    assignedTo?: string
  ) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  refreshTickets: () => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken, role } = useAuth();
  const [tickets, setTickets] = useState<HandoffTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage key is scoped to the authenticated user ID (or anonymous)
  const storageKey = useMemo(() => {
    return user?.id ? `campusone_tickets_${user.id}` : 'campusone_tickets_anon';
  }, [user?.id]);

  // Load from local storage initially
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setTickets(JSON.parse(saved));
      } else {
        setTickets([]);
      }
    } catch (e) {
      console.error('Failed to load tickets from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Fetch live tickets from backend API when accessToken is available
  const refreshTickets = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const remoteTickets = await fetchTicketsApi(accessToken);
      if (Array.isArray(remoteTickets)) {
        setTickets(remoteTickets);
        try {
          localStorage.setItem(storageKey, JSON.stringify(remoteTickets));
        } catch {
          // ignore storage error
        }
      }
    } catch (err) {
      console.warn('Backend ticket fetch failed, using local cache:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, storageKey]);

  useEffect(() => {
    if (accessToken) {
      refreshTickets();
    }
  }, [accessToken, refreshTickets]);

  // Sync to local storage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to persist tickets to storage', e);
    }
  }, [tickets, isLoaded, storageKey]);

  const addTicket = useCallback(
    async (newTicket: HandoffTicket) => {
      const fullTicket: HandoffTicket = {
        ...newTicket,
        userId: newTicket.userId || user?.id,
        studentEmail: newTicket.studentEmail || user?.email,
        studentName:
          newTicket.studentName || user?.displayName || user?.email || 'Student Requester',
        status: newTicket.status || 'pending',
        createdAt: newTicket.createdAt || 'Just now',
      };

      // Optimistic update
      setTickets((prev) => {
        const exists = prev.some((t) => t.ticketId === fullTicket.ticketId);
        if (exists) {
          return prev.map((t) => (t.ticketId === fullTicket.ticketId ? { ...t, ...fullTicket } : t));
        }
        return [fullTicket, ...prev];
      });

      // Remote update
      if (accessToken) {
        try {
          const created = await createTicketApi(accessToken, fullTicket);
          setTickets((prev) =>
            prev.map((t) => (t.ticketId === fullTicket.ticketId ? { ...t, ...created } : t))
          );
        } catch (err) {
          console.warn('Failed to persist ticket to backend:', err);
        }
      }
    },
    [accessToken, user]
  );

  const updateTicketStatus = useCallback(
    async (
      ticketId: string,
      status: 'pending' | 'in_progress' | 'resolved',
      note?: string,
      assignedTo?: string
    ) => {
      // Optimistic update
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

      // Remote update
      if (accessToken) {
        try {
          await updateTicketStatusApi(accessToken, ticketId, status, note, assignedTo);
        } catch (err) {
          console.warn('Failed to update ticket status on backend:', err);
        }
      }
    },
    [accessToken]
  );

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      // Optimistic
      setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));

      // Remote
      if (accessToken) {
        try {
          await deleteTicketApi(accessToken, ticketId);
        } catch (err) {
          console.warn('Failed to delete ticket on backend:', err);
        }
      }
    },
    [accessToken]
  );

  // Filter tickets by current user if they are a student
  const isStaffOrAdmin = role === 'admin' || role === 'support_agent';
  const scopedTickets = useMemo(() => {
    if (isStaffOrAdmin) {
      return tickets;
    }
    if (!user) {
      return [];
    }
    const userEmail = (user.email || '').toLowerCase();
    const userId = user.id;

    return tickets.filter((t) => {
      const tEmail = (t.studentEmail || '').toLowerCase();
      const tUser = t.userId;
      if (tEmail && tEmail === userEmail) return true;
      if (tUser && tUser === userId) return true;
      // If neither is present, only match if it was created during the same anonymous session
      if (!tEmail && !tUser) return true;
      return false;
    });
  }, [tickets, isStaffOrAdmin, user]);

  const ongoingTickets = useMemo(
    () => scopedTickets.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [scopedTickets]
  );

  const resolvedTickets = useMemo(
    () => scopedTickets.filter((t) => t.status === 'resolved'),
    [scopedTickets]
  );

  const value = useMemo(
    () => ({
      tickets: isStaffOrAdmin ? tickets : scopedTickets,
      ongoingTickets,
      resolvedTickets,
      ongoingCount: ongoingTickets.length,
      resolvedCount: resolvedTickets.length,
      isLoading,
      addTicket,
      updateTicketStatus,
      deleteTicket,
      refreshTickets,
    }),
    [
      tickets,
      scopedTickets,
      isStaffOrAdmin,
      ongoingTickets,
      resolvedTickets,
      isLoading,
      addTicket,
      updateTicketStatus,
      deleteTicket,
      refreshTickets,
    ]
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
