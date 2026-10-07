'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConversationItem, Persona } from '@/lib/demoFixtures';
import { useAuth } from '@/context/AuthContext';
import {
  PanelLeftClose,
  Search,
  Pin,
  Trash2,
  LogOut,
  User,
  Shield,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  persona?: Persona;
  onDeleteConversation?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onNewChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  isOpen,
  onToggle,
  persona,
  onDeleteConversation,
  onTogglePin,
  onNewChat,
}) => {
  const { user, role: authRole, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const isPinned = (c: ConversationItem) => !!c.pinned || pinnedIds.includes(c.id);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(id);
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
  const pinnedList = filteredConversations.filter((c) => isPinned(c));
  const unpinnedList = filteredConversations.filter((c) => !isPinned(c));
  const todayList = unpinnedList.filter(
    (c) => c.updatedAt.includes('ago') || c.updatedAt === 'Just now'
  );
  const earlierList = unpinnedList.filter(
    (c) => !c.updatedAt.includes('ago') && c.updatedAt !== 'Just now'
  );

  const renderConversationItem = (conv: ConversationItem) => {
    const isActive = conv.id === activeId;
    const isConvPinnedState = isPinned(conv);

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        className={`group relative w-full text-left py-2.5 px-3 transition-colors cursor-pointer border-b border-[#1A1A1A] ${
          isActive
            ? 'border-l-2 border-l-[#FF7A00] bg-[#151515] text-[#F5F3ED] font-medium'
            : 'border-l-2 border-l-transparent text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#111111]'
        }`}
      >
        {/* Title and Pin/Delete Status */}
        <div className="flex items-center justify-between gap-1.5 w-full">
          <span className="truncate text-xs leading-snug">{conv.title}</span>

          {/* Action buttons on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => togglePin(conv.id, e)}
              className={`p-0.5 rounded hover:bg-[#202020] transition-colors ${
                isConvPinnedState ? 'text-[#FF7A00] opacity-100' : 'text-[#8D8A83]'
              }`}
              title={isConvPinnedState ? 'Unpin' : 'Pin'}
              aria-label={isConvPinnedState ? 'Unpin inquiry' : 'Pin inquiry'}
            >
              <Pin className="w-2.5 h-2.5" />
            </button>
            {conversations.length > 1 && (
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className="p-0.5 rounded hover:bg-[#202020] text-[#8D8A83] hover:text-red-400 transition-colors"
                title="Delete inquiry"
                aria-label="Delete inquiry"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status & Time in Monospace */}
        <div className="flex items-center justify-between w-full text-[10px] text-[#8D8A83] pt-0.5 font-mono">
          <span>{conv.updatedAt}</span>
          {conv.status === 'resolved' && (
            <span className="text-[#8D8A83]">· resolved</span>
          )}
          {conv.status === 'clarification' && (
            <span className="text-[#8D8A83]">· clarifying</span>
          )}
          {conv.status === 'handoff' && (
            <span className="text-[#FF7A00]">· escalated</span>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-[215px] shrink-0 bg-[#0B0B0B] flex flex-col h-full select-none border-r border-[#292929] text-[#F5F3ED] transition-all duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Drawer Header: Printed Index Eyebrow */}
        <div className="py-2.5 px-3 flex items-center justify-between border-b border-[#292929]">
          <span className="font-mono text-[9.5px] uppercase tracking-widest text-[#8D8A83]/80">
            — INQUIRY HISTORY //
          </span>

          <button
            onClick={onToggle}
            className="lg:hidden text-[#8D8A83] hover:text-white p-1 rounded"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Inquiry Action Button */}
        {onNewChat && (
          <div className="p-2 border-b border-[#292929]">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[#16171D] hover:bg-[#1E2028] border border-[#2B2D38] hover:border-[#FF7A00]/50 text-xs font-mono text-[#F5F3ED] hover:text-[#FF7A00] transition-colors cursor-pointer"
              title="Start a new student inquiry"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>New inquiry</span>
            </button>
          </div>
        )}

        {/* Minimal Search Field */}
        <div className="p-2.5 border-b border-[#292929]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#8D8A83]/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search index..."
              className="w-full bg-[#111111] border border-[#292929] text-[#F5F3ED] placeholder:text-[#8D8A83]/40 text-xs font-mono rounded pl-7 pr-2 py-1 focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>
        </div>

        {/* Conversation List with Timeline Sections */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A]">
          {filteredConversations.length === 0 ? (
            <div className="py-6 px-3 space-y-1">
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#8D8A83]/40">
                {searchQuery ? 'NO MATCHES' : 'INDEX IS EMPTY'}
              </div>
              <p className="text-[10px] text-[#8D8A83]/25 font-mono leading-relaxed">
                Inquiries will be catalogued here.
              </p>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedList.length > 0 && (
                <div>
                  <div className="text-[9.5px] font-mono uppercase tracking-widest text-[#8D8A83] px-3 pt-2.5 pb-1 bg-[#0B0B0B]">
                    PINNED
                  </div>
                  {pinnedList.map(renderConversationItem)}
                </div>
              )}

              {/* Today Section */}
              {todayList.length > 0 && (
                <div>
                  <div className="text-[9.5px] font-mono uppercase tracking-widest text-[#8D8A83] px-3 pt-2.5 pb-1 bg-[#0B0B0B]">
                    TODAY
                  </div>
                  {todayList.map(renderConversationItem)}
                </div>
              )}

              {/* Earlier Section */}
              {earlierList.length > 0 && (
                <div>
                  <div className="text-[9.5px] font-mono uppercase tracking-widest text-[#8D8A83] px-3 pt-2.5 pb-1 bg-[#0B0B0B]">
                    EARLIER
                  </div>
                  {earlierList.map(renderConversationItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Dynamic Authenticated User Footer Pill */}
        {(() => {
          const displayName = user?.displayName || persona?.name || 'Student';
          const email = user?.email || (authRole === 'admin' ? 'admin@campus.edu' : 'student@campus.edu');
          const roleLabel = authRole === 'admin' ? 'Admin' : (user?.role === 'staff' ? 'Staff' : 'Student');
          const initials = displayName
            .split(' ')
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'U';

          const handleLogout = () => {
            logout();
            router.push('/login');
          };

          return (
            <div className="p-3 border-t border-[#292929] flex items-center justify-between gap-2 text-xs font-mono text-[#8D8A83] bg-[#0E0E12]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#1C1E26] border border-[#2D303E] flex items-center justify-center text-[10px] font-bold text-[#FF7A00] shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-[#F5F3ED] text-xs font-medium leading-tight">
                    {displayName}
                  </span>
                  <span className="truncate text-[10px] text-[#8D8A83] leading-tight">
                    {roleLabel} &bull; {email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1 rounded text-[#8D8A83] hover:text-rose-400 hover:bg-[#1A1A22] transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}
      </aside>
    </>
  );
};

