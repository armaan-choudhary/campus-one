'use client';

import React, { useState } from 'react';
import { ConversationItem, Persona } from '@/lib/demoFixtures';
import {
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  PanelLeftClose,
  Clock,
  Search,
  Pin,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  persona: Persona;
  onDeleteConversation?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  isOpen,
  onToggle,
  persona,
  onDeleteConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation?.(id);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group into Pinned, Today, and Earlier
  const pinnedList = filteredConversations.filter((c) => pinnedIds.includes(c.id));
  const unpinnedList = filteredConversations.filter((c) => !pinnedIds.includes(c.id));
  const todayList = unpinnedList.filter(
    (c) => c.updatedAt.includes('ago') || c.updatedAt === 'Just now'
  );
  const earlierList = unpinnedList.filter(
    (c) => !c.updatedAt.includes('ago') && c.updatedAt !== 'Just now'
  );

  const renderConversationItem = (conv: ConversationItem) => {
    const isActive = conv.id === activeId;
    const isPinned = pinnedIds.includes(conv.id);

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        className={`group relative w-full text-left p-3 rounded-2xl transition-all flex flex-col gap-1.5 cursor-pointer ${
          isActive
            ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-medium shadow-xs border-l-2 border-l-[var(--accent)] border-y border-r border-[var(--border-subtle)] pl-2.5'
            : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]/60'
        }`}
      >
        {/* Title and Pin Status */}
        <div className="flex items-center justify-between gap-1.5 w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageSquare
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
              }`}
            />
            <span className="truncate text-[13.5px] leading-snug">{conv.title}</span>
          </div>

          {/* Action buttons on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => togglePin(conv.id, e)}
              className={`p-1 rounded hover:bg-[var(--surface-1)] transition-colors ${
                isPinned ? 'text-[var(--accent)] opacity-100' : 'text-[var(--text-tertiary)]'
              }`}
              title={isPinned ? 'Unpin' : 'Pin'}
              aria-label={isPinned ? 'Unpin inquiry' : 'Pin inquiry'}
            >
              <Pin className="w-3 h-3" />
            </button>
            {conversations.length > 1 && (
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className="p-1 rounded hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                title="Delete inquiry"
                aria-label="Delete inquiry"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Status & Time */}
        <div className="flex items-center justify-between w-full text-xs text-[var(--text-tertiary)] pl-6">
          <span>{conv.updatedAt}</span>
          {conv.status === 'resolved' && (
            <span className="inline-flex items-center gap-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[11px] text-[var(--text-secondary)]">
              <CheckCircle2 className="w-2.5 h-2.5 text-[var(--accent)]" />
              Resolved
            </span>
          )}
          {conv.status === 'clarification' && (
            <span className="inline-flex items-center gap-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[11px] text-[var(--accent)]">
              <HelpCircle className="w-2.5 h-2.5" />
              Clarifying
            </span>
          )}
          {conv.status === 'handoff' && (
            <span className="inline-flex items-center gap-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[11px] text-[var(--text-secondary)]">
              <ArrowUpRight className="w-2.5 h-2.5" />
              Escalated
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed sm:static inset-y-0 left-0 z-40 sm:z-auto w-72 shrink-0 bg-[var(--surface-1)] flex flex-col h-full select-none border-r border-[var(--border-subtle)] transition-all duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full sm:hidden'
        }`}
      >
        {/* Drawer Header */}
        <div className="py-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="tracking-tight text-xs font-medium">Inquiry History</span>
          </div>
          <button
            onClick={onToggle}
            className="text-[var(--text-secondary)] hover:text-[var(--foreground)] p-1.5 rounded-full hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
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
              className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-full pl-8 pr-3 py-1.5 text-[13px] placeholder:text-[13px] text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Conversation List with Timeline Sections */}
        <div className="flex-1 overflow-y-auto px-3 space-y-3 pb-2">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
              No inquiries match &quot;{searchQuery}&quot;
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedList.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] px-2">
                    Pinned
                  </div>
                  {pinnedList.map(renderConversationItem)}
                </div>
              )}

              {/* Today Section */}
              {todayList.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] px-2">
                    Today
                  </div>
                  {todayList.map(renderConversationItem)}
                </div>
              )}

              {/* Earlier Section */}
              {earlierList.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] px-2">
                    Earlier This Week
                  </div>
                  {earlierList.map(renderConversationItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Profile Card */}
        <div className="p-3 m-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center gap-2.5 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-semibold text-[var(--accent)] shrink-0">
            {persona.avatar}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-[var(--foreground)] truncate">{persona.name}</span>
            <span className="text-xs text-[var(--text-secondary)] truncate">{persona.title}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
