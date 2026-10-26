import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { useVoice } from '../hooks/useVoice.ts';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    speechLanguage,
    setSpeechLanguage,
  } = useVoice();

  // If transcript updates from speech, update input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((finalText) => {
        if (finalText.trim()) {
          onSendMessage(finalText.trim());
          setInput('');
        }
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Voice Listening Active Banner */}
      {isListening && (
        <div className="mb-2.5 p-3 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 backdrop-blur-md flex items-center justify-between text-xs text-indigo-200 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-lg shadow-indigo-950/50">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">ভয়েস শুনছি...</span>
              <span className="text-slate-300 italic truncate max-w-xs sm:max-w-md">
                {transcript || 'আপনার প্রশ্ন স্পষ্ট করে বলুন...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSpeechLanguage(speechLanguage === 'bn-BD' ? 'en-US' : 'bn-BD')
              }
              className="px-2 py-0.5 rounded-md bg-indigo-900/60 hover:bg-indigo-800 text-[10px] text-indigo-300 font-mono transition-colors"
            >
              ভাষা: {speechLanguage === 'bn-BD' ? 'বাংলা' : 'English'}
            </button>
            <button
              type="button"
              onClick={stopListening}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Input Bar */}
      <div className="relative rounded-2xl bg-slate-900/90 dark:bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/25 shadow-2xl backdrop-blur-xl transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="বাশার এআই-কে পৃথিবীর যেকোনো বিষয়ে প্রশ্ন করুন... (Shift + Enter নতুন লাইনের জন্য)"
          rows={1}
          className="w-full pt-3.5 pb-12 pl-4 pr-24 sm:pr-28 text-slate-100 placeholder-slate-400 bg-transparent resize-none text-[15px] outline-none leading-relaxed max-h-44 disabled:opacity-50"
        />

        {/* Action Buttons Toolbar at Bottom Inside */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          {/* Left Feature Tags */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-[11px] font-medium text-indigo-300 border border-slate-700/60">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Fast 3.8</span>
            </div>

            {isSupported && (
              <button
                type="button"
                onClick={() =>
                  setSpeechLanguage(speechLanguage === 'bn-BD' ? 'en-US' : 'bn-BD')
                }
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                title="ভয়েস ইনপুট ভাষা পরিবর্তন"
              >
                <Globe className="w-3 h-3" />
                <span>{speechLanguage === 'bn-BD' ? 'বাংলা' : 'EN'}</span>
              </button>
            )}
          </div>

          {/* Right Action Icons: Mic + Send */}
          <div className="flex items-center gap-1.5">
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title={isListening ? 'রেকর্ডিং বন্ধ করুন' : 'ভয়েস কমান্ড দিয়ে প্রশ্ন করুন'}
                aria-label="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading || disabled}
              className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                input.trim() && !isLoading && !disabled
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-100'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="পাঠান (Enter)"
              aria-label="Send message"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-500">
        বাশার এআই (Bashar AI) অত্যন্ত দ্রুত নির্ভুল তথ্য প্রদান করে। গুরুত্বপূর্ণ তথ্যের ক্ষেত্রে যাচাই করার পরামর্শ দেয়া হয়।
      </div>
    </div>
  );
};
