import React, { useState, useEffect } from 'react';
import { Note } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  Save
} from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNote?: { title: string; content: string } | null;
  onClearInitialNote?: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  initialNote,
  onClearInitialNote,
}) => {
  const { user, token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load notes from server or localStorage
  const loadNotes = async () => {
    if (!token) {
      try {
        const local = localStorage.getItem('bashar_ai_guest_notes');
        if (local) {
          const parsed = JSON.parse(local);
          setNotes(parsed);
          if (parsed.length > 0 && !activeNoteId) {
            setActiveNoteId(parsed[0].id);
            setTitle(parsed[0].title);
            setContent(parsed[0].content);
          }
        }
      } catch (e) {
        console.error('Error loading local notes:', e);
      }
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/notes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Note[] = await res.json();
        setNotes(data);
        if (data.length > 0 && !activeNoteId) {
          setActiveNoteId(data[0].id);
          setTitle(data[0].title);
          setContent(data[0].content);
        }
      }
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, token]);

  // Handle prefilling from an AI response
  useEffect(() => {
    if (initialNote && isOpen) {
      setActiveNoteId(null);
      setTitle(initialNote.title || 'নতুন নোট');
      setContent(initialNote.content || '');
      if (onClearInitialNote) onClearInitialNote();
    }
  }, [initialNote, isOpen]);

  // Switch active note
  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  // Start a fresh new note
  const handleNewNote = () => {
    setActiveNoteId(null);
    setTitle('');
    setContent('');
  };

  // Save current note
  const handleSaveNote = async () => {
    if (!title.trim()) {
      alert('দয়া করে নোটের একটি নাম দিন।');
      return;
    }

    if (!token) {
      // Guest note save in localStorage
      if (activeNoteId) {
        const updated = notes.map((n) =>
          n.id === activeNoteId
            ? { ...n, title: title.trim(), content: content.trim(), updatedAt: new Date().toISOString() }
            : n
        );
        setNotes(updated);
        localStorage.setItem('bashar_ai_guest_notes', JSON.stringify(updated));
      } else {
        const newNote: Note = {
          id: crypto.randomUUID(),
          userId: 'guest',
          title: title.trim(),
          content: content.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updated = [newNote, ...notes];
        setNotes(updated);
        setActiveNoteId(newNote.id);
        localStorage.setItem('bashar_ai_guest_notes', JSON.stringify(updated));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    try {
      if (activeNoteId) {
        const res = await fetch(`/api/notes/${activeNoteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content }),
        });
        if (res.ok) {
          const updatedNote = await res.json();
          setNotes((prev) => prev.map((n) => (n.id === activeNoteId ? updatedNote : n)));
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content }),
        });
        if (res.ok) {
          const newNote = await res.json();
          setNotes((prev) => [newNote, ...prev]);
          setActiveNoteId(newNote.id);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('আপনি কি এই নোটটি মুছে ফেলতে চান?')) return;

    if (!token) {
      const filtered = notes.filter((n) => n.id !== id);
      setNotes(filtered);
      localStorage.setItem('bashar_ai_guest_notes', JSON.stringify(filtered));
      if (activeNoteId === id) {
        if (filtered.length > 0) {
          handleSelectNote(filtered[0]);
        } else {
          handleNewNote();
        }
      }
      return;
    }

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const filtered = notes.filter((n) => n.id !== id);
        setNotes(filtered);
        if (activeNoteId === id) {
          if (filtered.length > 0) {
            handleSelectNote(filtered[0]);
          } else {
            handleNewNote();
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Copy note
  const handleCopyNote = () => {
    navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download note as text file
  const handleDownloadNote = () => {
    const element = document.createElement('a');
    const file = new Blob([`${title}\n\n${content}`], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.trim() || 'note'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>বাশার এআই নোটবুক (Notes)</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  {notes.length} টি সংরক্ষিত
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">যেকোনো প্রশ্ন, তথ্য বা এআই উত্তর শিরোনাম দিয়ে সংরক্ষণ করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন নোট</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Layout: Master-Detail */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Left: Notes List */}
          <div className="w-full sm:w-72 lg:w-80 border-b sm:border-b-0 sm:border-r border-slate-800 flex flex-col bg-slate-950/50">
            {/* Search */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="নোট খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p>কোনো নোট পাওয়া যায়নি।</p>
                  <p className="mt-1 text-slate-600">'নতুন নোট' বাটনে ক্লিক করে তৈরি করুন।</p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isActive = note.id === activeNoteId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`group p-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                          : 'bg-transparent border-transparent hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-semibold truncate group-hover:text-indigo-300">
                          {note.title || 'শিরোনামহীন নোট'}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {note.content || 'কোনো বিবরণ নেই'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Note Editor */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto bg-slate-900/60">
            {/* Note Title Input */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                নোটের নাম / শিরোনাম (Note Title)
              </label>
              <input
                type="text"
                placeholder="যেমন: পাইথনের গুরুত্বপূর্ণ টিপস বা সাধারণ জ্ঞান"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm font-semibold outline-none"
              />
            </div>

            {/* Note Content Textarea */}
            <div className="flex-1 flex flex-col mb-3 min-h-[220px]">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                নোটের বিবরণ ও তথ্য (Content)
              </label>
              <textarea
                placeholder="আপনার প্রয়োজনীয় তথ্য, বাশার এআই-এর উত্তরের অংশ বা কোনো গুরুত্বপূর্ণ নোট এখানে লিখুন..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm leading-relaxed outline-none resize-none"
              />
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNote}
                  disabled={!title && !content}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                  title="কপি করুন"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadNote}
                  disabled={!title && !content}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                  title="ডাউনলোড করুন"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড (.txt)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>সংরক্ষিত হয়েছে!</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>নোট সংরক্ষণ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
