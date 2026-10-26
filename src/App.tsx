import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Chat, Message } from './types.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatArea } from './components/ChatArea.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { NotesModal } from './components/NotesModal.tsx';
import {
  Menu,
  Sparkles,
  LogIn,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Trash2,
  CheckCircle2
} from 'lucide-react';

function BasharAiApp() {
  const { user, token, refreshUserData, isSyncing, syncNow } = useAuth();

  // Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('bashar_ai_theme');
    if (saved) return saved === 'dark';
    return true; // Default dark
  });

  // UI modal states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [pendingNote, setPendingNote] = useState<{ title: string; content: string } | null>(null);

  // Chat states
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('bashar_ai_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bashar_ai_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load chats from server or local
  const fetchChats = async () => {
    if (!token) {
      // Local chats for guest user
      try {
        const local = localStorage.getItem('bashar_ai_guest_chats');
        if (local) {
          const parsed = JSON.parse(local);
          setChats(parsed);
          if (parsed.length > 0 && !activeChatId) {
            setActiveChatId(parsed[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading guest chats:', e);
      }
      return;
    }

    try {
      const res = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Chat[] = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [token]);

  // Load messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      if (!token) {
        const localMsg = localStorage.getItem(`bashar_ai_msgs_${activeChatId}`);
        if (localMsg) {
          try {
            setMessages(JSON.parse(localMsg));
          } catch {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
        return;
      }

      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadMessages();
  }, [activeChatId, token]);

  // Create new chat
  const handleNewChat = async () => {
    if (!token) {
      const newGuestChat: Chat = {
        id: crypto.randomUUID(),
        userId: 'guest',
        title: 'নতুন কথোপকথন',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newGuestChat, ...chats];
      setChats(updated);
      setActiveChatId(newGuestChat.id);
      setMessages([]);
      localStorage.setItem('bashar_ai_guest_chats', JSON.stringify(updated));
      return;
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'নতুন কথোপকথন' }),
      });
      if (res.ok) {
        const newChat: Chat = await res.json();
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Delete a chat with immediate state update and clean fallback
  const handleDeleteChat = async (chatId: string) => {
    // 1. Guest mode delete
    if (!token) {
      const filtered = chats.filter((c) => c.id !== chatId);
      setChats(filtered);
      localStorage.setItem('bashar_ai_guest_chats', JSON.stringify(filtered));
      localStorage.removeItem(`bashar_ai_msgs_${chatId}`);

      if (activeChatId === chatId) {
        const nextId = filtered[0]?.id || null;
        setActiveChatId(nextId);
        if (!nextId) {
          setMessages([]);
        }
      }
      showNotification('চ্যাটটি মুছে ফেলা হয়েছে।');
      return;
    }

    // 2. Authenticated user delete
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const remaining = chats.filter((c) => c.id !== chatId);
        setChats(remaining);

        if (activeChatId === chatId) {
          const nextId = remaining[0]?.id || null;
          setActiveChatId(nextId);
          if (!nextId) {
            setMessages([]);
          }
        }
        showNotification('চ্যাটটি সফলভাবে মুছে ফেলা হয়েছে।');
        await syncNow();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMessage(errJson.error || 'চ্যাট মুছতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setErrorMessage('সার্ভার থেকে চ্যাট মুছতে ব্যর্থ হয়েছে।');
    }
  };

  // Delete current active chat from header button
  const handleDeleteCurrentChat = () => {
    if (!activeChatId) return;
    if (window.confirm('আপনি কি বর্তমান কথোপকথনটি সম্পূর্ণ মুছে ফেলতে চান?')) {
      handleDeleteChat(activeChatId);
    }
  };

  // Rename chat
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!token) {
      const updated = chats.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c));
      setChats(updated);
      localStorage.setItem('bashar_ai_guest_chats', JSON.stringify(updated));
      return;
    }

    try {
      const res = await fetch(`/api/chats/${chatId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)));
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  // Send message to Bashar AI
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setErrorMessage(null);

    let currentChatId = activeChatId;
    if (!currentChatId) {
      const tempId = crypto.randomUUID();
      const newChatObj: Chat = {
        id: tempId,
        userId: user ? user.id : 'guest',
        title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentChatId = tempId;
      setActiveChatId(tempId);
      setChats((prev) => [newChatObj, ...prev]);
      if (!token) {
        localStorage.setItem('bashar_ai_guest_chats', JSON.stringify([newChatObj, ...chats]));
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId: currentChatId,
      userId: user ? user.id : 'guest',
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessagesList = [...messages, userMessage];
    setMessages(newMessagesList);
    if (!token) {
      localStorage.setItem(`bashar_ai_msgs_${currentChatId}`, JSON.stringify(newMessagesList));
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          chatId: currentChatId,
          message: text,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      // Safely parse JSON from response
      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error('Server returned non-JSON:', rawText);
        throw new Error('সার্ভার থেকে অপ্রত্যাশিত প্রতিক্রিয়া এসেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }

      if (!response.ok) {
        throw new Error(data.error || 'এআই থেকে উত্তর পেতে সমস্যা হয়েছে।');
      }

      const assistantMessage: Message = data.message || {
        id: crypto.randomUUID(),
        chatId: currentChatId,
        userId: user ? user.id : 'guest',
        role: 'assistant',
        content: data.reply || '',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessagesList, assistantMessage];
      setMessages(finalMessages);

      if (!token) {
        localStorage.setItem(`bashar_ai_msgs_${currentChatId}`, JSON.stringify(finalMessages));
      }

      // Update chat title in sidebar if updated
      if (data.chat) {
        setChats((prev) => {
          const exists = prev.some((c) => c.id === data.chat.id);
          const updatedChats = exists
            ? prev.map((c) => (c.id === data.chat.id ? data.chat : c))
            : [data.chat, ...prev];

          if (!token) {
            localStorage.setItem('bashar_ai_guest_chats', JSON.stringify(updatedChats));
          }
          return updatedChats;
        });
      }

      // Sync stats if user is logged in
      if (token) {
        refreshUserData();
      }
    } catch (err: any) {
      console.error('Error querying Bashar AI:', err);
      setErrorMessage(err.message || 'নেটওয়ার্ক বা সার্ভারে সমস্যা দেখা দিয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.role === 'assistant') {
          copy.pop();
        }
        return copy;
      });
      handleSendMessage(lastUserMessage.content);
    }
  };

  // Open note modal with AI answer prefilled
  const handleSaveToNotes = (note: { title: string; content: string }) => {
    setPendingNote(note);
    setIsNotesModalOpen(true);
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => setActiveChatId(id)}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenNotes={() => setIsNotesModalOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-slate-900/40 dark:bg-slate-950">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white truncate">
                {activeChat ? activeChat.title : 'নতুন কথোপকথন'}
              </h2>

              {/* Direct Delete Current Chat Button in Header */}
              {activeChat && messages.length > 0 && (
                <button
                  onClick={handleDeleteCurrentChat}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="বর্তমান কথোপকথনটি মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Toolbar */}
          <div className="flex items-center gap-2">
            {/* Notes Button in Header */}
            <button
              onClick={() => setIsNotesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="আপনার নোটবুক খুলুন"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">নোটবুক</span>
            </button>

            {/* Real-time status badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>{user ? 'ক্লাউড সিঙ্ক সক্রিয়' : 'বাশার এআই প্রস্তুত'}</span>
            </div>

            {/* User profile or login button */}
            {user ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all text-xs text-slate-200 cursor-pointer"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-indigo-500/50 object-cover"
                />
                <span className="hidden sm:inline font-medium">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন / সাইন আপ</span>
              </button>
            )}
          </div>
        </header>

        {/* Floating Notification Toast */}
        {notification && (
          <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Guest notification notice if not logged in */}
        {!user && messages.length > 0 && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-[11px] flex items-center justify-between animate-in fade-in duration-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>আপনার বর্তমান চ্যাটগুলো ব্রাউজারে সংরক্ষিত হচ্ছে। স্থায়ী ক্লাউড সিঙ্কের জন্য লগইন বা অ্যাকাউন্ট তৈরি করুন।</span>
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-white underline font-semibold hover:text-indigo-200 ml-2 shrink-0 cursor-pointer"
            >
              সাইন আপ করুন
            </button>
          </div>
        )}

        {/* Error Alert Banner if any */}
        {errorMessage && (
          <div className="mx-4 mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        )}

        {/* Chat Feed */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendPrompt={handleSendMessage}
          onRegenerate={handleRegenerate}
          onSaveToNotes={handleSaveToNotes}
        />

        {/* Bottom Chat Input Dock */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          fetchChats();
        }}
      />

      {/* User Profile Modal with Logo Upload */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Notes Modal */}
      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setPendingNote(null);
        }}
        initialNote={pendingNote}
        onClearInitialNote={() => setPendingNote(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BasharAiApp />
    </AuthProvider>
  );
}
