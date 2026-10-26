import React, { useState } from 'react';
import { Chat } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import {
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogIn,
  RefreshCw,
  Clock,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onClearAllChats?: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onOpenNotes: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onOpenNotes,
  isDark,
  onToggleTheme,
  onOpenProfile,
  onOpenAuth,
  isOpen,
  onToggleOpen,
}) => {
  const { user, isSyncing } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter chats by search query
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by date
  const now = new Date();
  const todayChats: Chat[] = [];
  const yesterdayChats: Chat[] = [];
  const pastWeekChats: Chat[] = [];
  const olderChats: Chat[] = [];

  const oneDay = 24 * 60 * 60 * 1000;

  filteredChats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt || chat.createdAt);
    const diffDays = Math.floor((now.getTime() - chatDate.getTime()) / oneDay);

    if (diffDays === 0) {
      todayChats.push(chat);
    } else if (diffDays === 1) {
      yesterdayChats.push(chat);
    } else if (diffDays <= 7) {
      pastWeekChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  });

  const handleStartRename = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (chatId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 sm:w-80 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">Bashar AI</span>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  v3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">বাশার এআই অ্যাসিস্ট্যান্ট</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            <button
              onClick={onToggleOpen}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Chat & Notes Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/20 border border-indigo-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন চ্যাট শুরু করুন</span>
          </button>

          <button
            onClick={() => {
              onOpenNotes();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>নোটবুক (My Notes)</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="কথোপকথন খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950/60 dark:bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat List Groupings */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
              <p>কোনো পূর্ববর্তী চ্যাট নেই।</p>
              <p className="mt-1 text-slate-600">উপরে 'নতুন চ্যাট' এ ক্লিক করে যেকোনো প্রশ্ন জিজ্ঞেস করুন।</p>
            </div>
          ) : (
            <>
              {todayChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>আজ</span>
                  </div>
                  <div className="space-y-1">{todayChats.map((c) => renderChatItem(c))}</div>
                </div>
              )}

              {yesterdayChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>গতকাল</span>
                  </div>
                  <div className="space-y-1">{yesterdayChats.map((c) => renderChatItem(c))}</div>
                </div>
              )}

              {pastWeekChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    বিগত ৭ দিন
                  </div>
                  <div className="space-y-1">{pastWeekChats.map((c) => renderChatItem(c))}</div>
                </div>
              )}

              {olderChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    পূর্ববর্তী
                  </div>
                  <div className="space-y-1">{olderChats.map((c) => renderChatItem(c))}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Card & Auth Section at Bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {user ? (
            <div
              onClick={onOpenProfile}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all border border-transparent hover:border-slate-700/60 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-indigo-500/40 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-white">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" title="রিয়েল-টাইম সিঙ্ক সক্রিয়" />
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-indigo-600 hover:text-white border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন / সাইন আপ করুন</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );

  function renderChatItem(chat: Chat) {
    const isActive = chat.id === activeChatId;
    const isEditing = chat.id === editingChatId;

    if (isEditing) {
      return (
        <form
          key={chat.id}
          onSubmit={(e) => handleSaveRename(chat.id, e)}
          className="flex items-center gap-1 p-1 rounded-lg bg-slate-800 border border-indigo-500"
        >
          <input
            type="text"
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent px-2 py-1 text-xs text-white outline-none"
          />
          <button
            type="submit"
            className="p-1 text-emerald-400 hover:text-emerald-300"
            title="সংরক্ষণ"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingChatId(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-200"
            title="বাতিল"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={chat.id}
        onClick={() => {
          onSelectChat(chat.id);
          if (window.innerWidth < 1024) onToggleOpen();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <MessageSquare
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
            }`}
          />
          <span className="truncate">{chat.title}</span>
        </div>

        {/* Action buttons (always visible on touch / visible on hover on desktop) */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => handleStartRename(chat, e)}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-700/80 transition-colors"
            title="নাম পরিবর্তন"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteChat(chat.id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="চ্যাট মুছে ফেলুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
};
