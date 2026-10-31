import React, { useState, useRef, useEffect } from 'react';
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
  BookOpen,
  Keyboard,
  Pin
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onClearAllChats?: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onTogglePinChat?: (chatId: string) => void;
  onOpenNotes: () => void;
  onOpenShortcuts?: () => void;
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
  onTogglePinChat,
  onOpenNotes,
  onOpenShortcuts,
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const metaKey = isMac ? '⌘' : 'Ctrl';

  // Listen for Ctrl+F / Cmd+F to focus search input
  useEffect(() => {
    const handleSearchKey = (e: KeyboardEvent) => {
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleSearchKey);
    return () => window.removeEventListener('keydown', handleSearchKey);
  }, [isMac]);

  // Filter chats by search query
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by pinned status & date
  const now = new Date();
  const pinnedChats: Chat[] = [];
  const todayChats: Chat[] = [];
  const yesterdayChats: Chat[] = [];
  const pastWeekChats: Chat[] = [];
  const olderChats: Chat[] = [];

  const oneDay = 24 * 60 * 60 * 1000;

  filteredChats.forEach((chat) => {
    // If pinned, keep at top in dedicated pinned section
    if (chat.isPinned) {
      pinnedChats.push(chat);
      return;
    }

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

        {/* Search Bar at Top of Sidebar */}
        <div className="p-3 pb-2 border-b border-slate-800/80 bg-slate-950/20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="কথোপকথন খুঁজুন (Ctrl+F)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                title="সার্চ মুছুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 pointer-events-none">
                {metaKey}+F
              </kbd>
            )}
          </div>
        </div>

        {/* New Chat & Notes Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/20 border border-indigo-500/30 transition-all cursor-pointer"
            title={`নতুন চ্যাট (${metaKey}+K)`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>নতুন চ্যাট শুরু করুন</span>
            </div>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/50 font-mono">
              {metaKey}+K
            </kbd>
          </button>

          <button
            onClick={() => {
              onOpenNotes();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
            title={`নোটবুক (${metaKey}+Shift+N)`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>নোটবুক (My Notes)</span>
            </div>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 font-mono">
              {metaKey}+Shift+N
            </kbd>
          </button>
        </div>

        {/* Chat List Groupings */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
              <p>কোনো পূর্ববর্তী চ্যাট নেই।</p>
              <p className="mt-1 text-slate-600">উপরে 'নতুন চ্যাট' এ ক্লিক করে যেকোনো প্রশ্ন জিজ্ঞেস করুন।</p>
            </div>
          ) : searchQuery.trim() && filteredChats.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs animate-in fade-in duration-150">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-semibold text-slate-300">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="mt-1 text-slate-400 text-[11px] truncate">
                "{searchQuery}" এর সাথে মিলে এমন কোনো চ্যাট নেই।
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors cursor-pointer"
              >
                অনুসন্ধান মুছুন
              </button>
            </div>
          ) : (
            <>
              {searchQuery.trim() && (
                <div className="px-2 pb-2 text-[11px] font-medium text-slate-400 flex items-center justify-between border-b border-slate-800/60 mb-2">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Search className="w-3 h-3 text-indigo-400" />
                    <span>ফলাফল: {filteredChats.length}টি চ্যাট</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    সব দেখুন
                  </button>
                </div>
              )}

              {/* Pinned Chats Section */}
              {pinnedChats.length > 0 && (
                <div className="pb-1">
                  <div className="px-2 pb-1 text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>পিন করা কথোপকথন ({pinnedChats.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">{pinnedChats.map((c) => renderChatItem(c))}</div>
                </div>
              )}

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
          {/* Keyboard Shortcuts Trigger Button */}
          {onOpenShortcuts && (
            <button
              onClick={() => {
                onOpenShortcuts();
                if (window.innerWidth < 1024) onToggleOpen();
              }}
              className="w-full mb-2 flex items-center justify-between py-1.5 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700 transition-all cursor-pointer"
              title="কীবোর্ড শর্টকাট সহায়িকা"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>শর্টকাট সহায়িকা</span>
              </div>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                {metaKey}+/
              </kbd>
            </button>
          )}

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
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {chat.isPinned ? (
            <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          ) : (
            <MessageSquare
              className={`w-3.5 h-3.5 shrink-0 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            />
          )}
          <span className="truncate">{chat.title}</span>
        </div>

        {/* Action buttons (always visible on touch / visible on hover on desktop) */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onTogglePinChat && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePinChat(chat.id);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                chat.isPinned
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-700/80'
              }`}
              title={chat.isPinned ? 'আনপিন করুন' : 'শীর্ষে পিন করে রাখুন'}
            >
              <Pin className={`w-3.5 h-3.5 ${chat.isPinned ? 'fill-amber-400' : ''}`} />
            </button>
          )}

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
