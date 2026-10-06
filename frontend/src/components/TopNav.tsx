'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserRole, PERSONAS } from '@/lib/demoFixtures';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';
import { CampusOneMark } from '@/components/home/CampusOneMark';
import {
  Plus,
  PanelLeft,
  PanelLeftClose,
  MessageSquare,
  Ticket,
} from 'lucide-react';
import { useTickets } from '@/context/TicketContext';

interface TopNavProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  activeStudentTab?: 'chat' | 'tickets';
  onStudentTabChange?: (tab: 'chat' | 'tickets') => void;
  currentTheme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeStudentTab = 'chat',
  onStudentTabChange,
  onNewChat,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { role: authRole, user } = useAuth();
  const { ongoingCount } = useTickets();

  useEffect(() => {
    setMounted(true);
  }, []);
  const activePersona = PERSONAS[authRole] || PERSONAS.student;
  const displayName = user?.displayName || activePersona.name;
  const userSubtitle = user?.department || (authRole === 'admin' ? 'Administration' : 'Student');

  return (
    <header className="h-14 bg-[#0B0B0B] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-[#292929] text-[#F5F3ED] transition-colors select-none">
      {/* Left: Sidebar Toggle & Brand Identity */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle for Student Chat View */}
        {activeStudentTab === 'chat' && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-7 h-7 rounded flex items-center justify-center text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#151515] transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Hide inquiry history' : 'Show inquiry history'}
            aria-label={isSidebarOpen ? 'Hide inquiry history' : 'Show inquiry history'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Brand Link to Homepage */}
        <Link
          href="/"
          className="flex items-center gap-2 group py-1 cursor-pointer"
          title="Return to CampusOne Homepage"
        >
          <div className="w-4.5 h-4.5 flex items-center justify-center text-[#F5F3ED] transition-transform group-hover:scale-105">
            <CampusOneMark size={16} />
          </div>
          <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#F5F3ED]">
            CampusOne
          </span>
          <span className="text-[#292929] text-xs font-mono hidden sm:inline">/</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#8D8A83] hidden sm:inline">
            Service Desk
          </span>
        </Link>
      </div>

      {/* Center/Left: Navigation Links */}
      <nav className="hidden sm:flex items-center gap-7 text-xs font-mono ml-4">
        {onStudentTabChange && (
          <>
            <button
              onClick={() => onStudentTabChange('chat')}
              className={`relative py-1 transition-colors cursor-pointer ${
                activeStudentTab === 'chat'
                  ? 'text-[#F5F3ED] font-semibold'
                  : 'text-[#8D8A83] hover:text-[#F5F3ED]'
              }`}
            >
              <span>Assistant</span>
              {activeStudentTab === 'chat' && (
                <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#FF7A00]" />
              )}
            </button>

            <button
              onClick={() => onStudentTabChange('tickets')}
              className={`relative py-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeStudentTab === 'tickets'
                  ? 'text-[#F5F3ED] font-semibold'
                  : 'text-[#8D8A83] hover:text-[#F5F3ED]'
              }`}
            >
              <span>My Tickets</span>
              {mounted && ongoingCount > 0 && (
                <span className="text-[10px] text-[#FF7A00] font-mono font-bold">
                  [{ongoingCount}]
                </span>
              )}
              {activeStudentTab === 'tickets' && (
                <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#FF7A00]" />
              )}
            </button>
          </>
        )}

        <Link
          href="/admin"
          className="relative py-1 text-[#8D8A83] hover:text-[#F5F3ED] transition-colors cursor-pointer"
          title="Staff & Administrative Console"
        >
          <span>Staff/Admin</span>
        </Link>
      </nav>

      {/* Right Controls: User Profile Chip & Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile Ticket / Chat Quick Toggle */}
        {onStudentTabChange && (
          <button
            onClick={() => onStudentTabChange(activeStudentTab === 'chat' ? 'tickets' : 'chat')}
            className="sm:hidden w-7 h-7 rounded flex items-center justify-center text-[#8D8A83] hover:text-[#F5F3ED] hover:bg-[#151515] transition-colors relative"
            title={activeStudentTab === 'chat' ? 'View My Tickets' : 'Switch to Assistant'}
            aria-label={activeStudentTab === 'chat' ? 'View My Tickets' : 'Switch to Assistant'}
          >
            {activeStudentTab === 'chat' ? (
              <>
                <Ticket className="w-4 h-4" />
                {mounted && ongoingCount > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF7A00] rounded-full" />
                )}
              </>
            ) : (
              <MessageSquare className="w-4 h-4 text-[#FF7A00]" />
            )}
          </button>
        )}

        {/* New Inquiry Action */}
        <button
          onClick={onNewChat}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-[#A1A1AA] hover:text-[#FF7A00] hover:bg-[#FF7A00]/5 border border-[#242531] hover:border-[#FF7A00]/40 transition-all cursor-pointer mr-1"
          title="New inquiry"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>New inquiry</span>
        </button>

        {/* User Identity Chip: Name + Title + Avatar */}
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2.5 text-right hover:opacity-95 transition-opacity cursor-pointer group"
          title="Campus Identity & Role Access"
        >
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-xs font-medium text-[#F5F3ED] group-hover:text-white">
              {displayName}
            </span>
            <span className="text-[10px] text-[#8D8A83] group-hover:text-[#FF7A00] transition-colors font-mono">
              {userSubtitle}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1E1E24] border border-[#2D2D36] group-hover:border-[#FF7A00]/50 transition-colors shrink-0 relative flex items-center justify-center text-xs font-mono font-bold text-[#F5F3ED]">
            <Image
              src={authRole === 'admin' ? '/illustrations/wimpy/avatar-4.png' : '/illustrations/wimpy/avatar-1.png'}
              alt={activePersona.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        </button>
      </div>

      {/* Global Campus Identity & Role Access Modal */}
      <LoginModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};

