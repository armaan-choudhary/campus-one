'use client';

import React, { useState } from 'react';
import { ConversationItem, Persona } from '@/lib/demoFixtures';
import {
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Search,
} from 'lucide-react';

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  persona: Persona;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  isOpen,
  onToggle,
  persona,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-20 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--foreground)] p-3.5 rounded-full transition-all shadow-xl md:hidden border border-[var(--border-subtle)] cursor-pointer"
        title="Open Sidebar"
      >
        <PanelLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-[var(--surface-1)] flex flex-col h-[calc(100vh-4rem)] select-none border-r border-[var(--border-subtle)] transition-all">
      {/* Drawer Header */}
      <div className="py-3.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="tracking-tight uppercase font-mono text-[10.5px]">Inquiry History</span>
        </div>
        <button
          onClick={onToggle}
          className="text-[var(--text-secondary)] hover:text-[var(--foreground)] p-1.5 rounded-full hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Inquiry Search Filter */}
      <div className="px-3 pb-2.5">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past inquiries..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-2">
        {filteredConversations.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
            No inquiries match "{searchQuery}"
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex flex-col gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-medium shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {/* Title */}
                <div className="flex items-center gap-2 font-medium line-clamp-1 w-full">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                    }`}
                  />
                  <span className="truncate text-xs leading-snug">{conv.title}</span>
                </div>

                {/* Status & Time */}
                <div className="flex items-center justify-between w-full text-[10.5px] text-[var(--text-tertiary)] pl-5.5">
                  <span>{conv.updatedAt}</span>
                  {conv.status === 'resolved' && (
                    <span className="inline-flex items-center gap-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[10px] text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[var(--accent)]" />
                      Resolved
                    </span>
                  )}
                  {conv.status === 'clarification' && (
                    <span className="inline-flex items-center gap-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[10px] text-[var(--accent)]">
                      <HelpCircle className="w-2.5 h-2.5" />
                      Clarifying
                    </span>
                  )}
                  {conv.status === 'handoff' && (
                    <span className="inline-flex items-center gap-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[10px] text-[var(--text-secondary)]">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      Escalated
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Profile Card */}
      <div className="p-3 m-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center gap-2.5 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0">
          {persona.avatar}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-[var(--foreground)] truncate">{persona.name}</span>
          <span className="text-[11px] text-[var(--text-secondary)] truncate">{persona.title}</span>
        </div>
      </div>
    </aside>
  );
};
