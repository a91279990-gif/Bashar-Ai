import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useVoice } from '../hooks/useVoice.ts';
import {
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  Cpu,
  Compass,
  Code2,
  Lightbulb,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendPrompt: (promptText: string) => void;
  onRegenerate: () => void;
  onSaveToNotes?: (note: { title: string; content: string }) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendPrompt,
  onRegenerate,
  onSaveToNotes,
}) => {
  const { user } = useAuth();
  const { speakingMessageId, speakText, stopSpeaking } = useVoice();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      category: 'বাশার এআই পরিচয়',
      title: 'বাশার এআই কে তৈরি করেছে?',
      prompt: 'বাশার এআই কে তৈরি করেছে এবং এর বৈশিষ্ট্যগুলো কী কী?',
    },
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      category: 'বিজ্ঞান ও প্রযুক্তি',
      title: 'কোয়ান্টাম কম্পিউটিং কীভাবে কাজ করে?',
      prompt: 'কোয়ান্টাম কম্পিউটিং এর মূল ধারণা এবং এটি কীভাবে সাধারণ কম্পিউটারের চেয়ে আলাদা, তা সহজে বুঝিয়ে বলো।',
    },
    {
      icon: <Code2 className="w-5 h-5 text-emerald-400" />,
      category: 'কোডিং ও ডেভেলপমেন্ট',
      title: 'একটি স্কেলেবল ফুল-স্ট্যাক আর্কিটেকচার',
      prompt: 'আধুনিক ফুল-স্ট্যাক ওয়েব অ্যাপ্লিকেশন তৈরির জন্য সেরা প্রযুক্তি এবং আর্কিটেকচারাল প্যাটার্ন আলোচনা করো।',
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
      category: 'সৃজনশীলতা ও কৌশল',
      title: 'একটি সফল স্টার্টআপ শুরুর গাইডলাইন',
      prompt: 'একটি নতুন ব্যবসায়িক আইডিয়াকে সফল স্টার্টআপে রূপান্তর করার জন্য ধাপে ধাপে কী কী কৌশল অনুসরণ করা উচিত?',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Empty State / Welcome Screen */}
        {messages.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col justify-center items-center text-center animate-in fade-in duration-300">
            {/* Glowing Brand Icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-2 bg-indigo-500/20 rounded-3xl blur-xl -z-10" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent mb-2">
              {user ? `স্বাগতম, ${user.name}!` : 'স্বাগতম Bashar AI তে!'}
            </h1>
            <p className="text-base text-slate-400 max-w-lg mb-8 leading-relaxed">
              আমি বাশার এআই। পৃথিবীর যেকোনো বিষয়, বিজ্ঞান, প্রযুক্তি, কোডিং, গণিত বা সাধারণ জ্ঞানের প্রশ্নের নির্ভুল ও তাৎক্ষণিক উত্তর দিতে আমি প্রস্তুত।
            </p>

            {/* Suggested Prompt Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {samplePrompts.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSendPrompt(item.prompt)}
                  className="group p-4 rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-105 transition-transform">
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>প্রশ্নটি করুন</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Messages Feed */
          messages.map((message) => {
            const isUser = message.role === 'user';
            const isSpeaking = speakingMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 animate-in fade-in duration-200 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0 mt-1">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`relative max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                      : 'bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Assistant Header Badge */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300">Bashar AI</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                          Flash 3.8
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {message.timestamp
                          ? new Date(message.timestamp).toLocaleTimeString('bn-BD', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}

                  {/* Assistant Footer Action Toolbar */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
                          title="উত্তর কপি করুন"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">কপি</span>
                            </>
                          )}
                        </button>

                        {/* Read Aloud (TTS) Button */}
                        <button
                          onClick={() => speakText(message.content, message.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                            isSpeaking
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                              : 'hover:bg-slate-800 hover:text-slate-200'
                          }`}
                          title={isSpeaking ? 'পড়া বন্ধ করুন' : 'শুনে নিন (ভয়েস)'}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-[11px] text-indigo-300">বন্ধ করুন</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">শুনুন</span>
                            </>
                          )}
                        </button>

                        {/* Save to Notes Button */}
                        {onSaveToNotes && (
                          <button
                            onClick={() => {
                              const previewTitle = message.content
                                .replace(/^[#*\s-]+/, '')
                                .slice(0, 32)
                                .trim();
                              onSaveToNotes({
                                title: previewTitle || 'বাশার এআই নোট',
                                content: message.content,
                              });
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-amber-300 text-slate-400 transition-colors"
                            title="নোটবুক-এ সংরক্ষণ করুন"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[11px]">নোটে সেভ</span>
                          </button>
                        )}
                      </div>

                      {/* Regenerate Button if last message */}
                      {messages[messages.length - 1].id === message.id && (
                        <button
                          onClick={onRegenerate}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50"
                          title="পুনরায় উত্তর তৈরি করুন"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">পুনরায় তৈরি</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-indigo-700 flex items-center justify-center shrink-0 mt-1 border border-indigo-500/40 overflow-hidden shadow-sm">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-5 h-5 text-white animate-spin" />
            </div>

            <div className="rounded-2xl rounded-tl-none p-4 bg-slate-900/90 border border-slate-800 text-slate-300 shadow-sm flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400">বাশার এআই উত্তর বিশ্লেষণ ও রচনা করছে...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
