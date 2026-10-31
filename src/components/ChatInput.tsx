import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Globe,
  Trash2,
  Check,
  AlertCircle,
  Volume2
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

// Window interface augmentation for SpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputBeforeSpeechRef = useRef<string>('');

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Adjust textarea height automatically based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input, interimTranscript]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('আপনার ব্রাউজারে SpeechRecognition API সমর্থিত নয়। অনুগ্রহ করে Google Chrome, Edge বা Safari ব্যবহার করুন।');
      return;
    }

    try {
      // If already running, abort first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;
      recognition.maxAlternatives = 1;

      // Remember existing input so speech appends smoothly
      baseInputBeforeSpeechRef.current = input;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (final) {
          const prefix = baseInputBeforeSpeechRef.current ? `${baseInputBeforeSpeechRef.current.trim()} ` : '';
          const updated = `${prefix}${final.trim()}`;
          baseInputBeforeSpeechRef.current = updated;
          setInput(updated);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজারের অনুমতি সেটিংস পরীক্ষা করুন।');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // No speech detected yet, keep listening or quiet
        } else if (event.error === 'network') {
          setErrorMessage('ভয়েস রিকগনিশন নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      setErrorMessage('ভয়েস ইনপুট চালু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setIsListening(false);
    }
  }, [input, speechLanguage]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageToggle = () => {
    const nextLang = speechLanguage === 'bn-BD' ? 'en-US' : 'bn-BD';
    setSpeechLanguage(nextLang);
    if (isListening) {
      stopListening();
      setTimeout(() => {
        // Restart with new language
        setSpeechLanguage(nextLang);
      }, 150);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalQuery = (input + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
    if (!finalQuery || isLoading || disabled) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(finalQuery);
    setInput('');
    setInterimTranscript('');
    baseInputBeforeSpeechRef.current = '';
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

  const handleClear = () => {
    setInput('');
    setInterimTranscript('');
    baseInputBeforeSpeechRef.current = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Error alert banner */}
      {errorMessage && (
        <div className="mb-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-amber-200 text-xs px-2 py-0.5 rounded"
          >
            ঠিক আছে
          </button>
        </div>
      )}

      {/* Active Voice Listening Banner */}
      {isListening && (
        <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-slate-900/90 border border-indigo-500/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200 shadow-xl shadow-indigo-950/40">
          <div className="flex items-center gap-3">
            {/* Animated pulsating microphone & audio wave bars */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/50">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500/30" />
              <Mic className="w-4 h-4 text-rose-400 relative z-10 animate-pulse" />
            </div>

            {/* Audio Waveform Simulator */}
            <div className="flex items-end gap-1 h-5 px-1">
              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s] h-5" />
              <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.45s] h-4" />
              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.2s] h-5" />
              <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.35s] h-2.5" />
            </div>

            <div className="flex flex-col">
              <span className="font-semibold text-white flex items-center gap-1.5">
                ভয়েস শুনছি...
                <span className="text-[11px] font-normal text-indigo-300">
                  ({speechLanguage === 'bn-BD' ? 'বাংলা ভাষা' : 'English'})
                </span>
              </span>
              <span className="text-slate-300 italic text-[11px] truncate max-w-xs sm:max-w-md">
                {interimTranscript || input || 'আপনার প্রশ্নটি স্পষ্ট করে বলুন...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 text-xs font-medium border border-indigo-700/40 transition-colors"
              title="ভয়েসের ভাষা পরিবর্তন করুন"
            >
              🌐 {speechLanguage === 'bn-BD' ? 'English-এ বলুন' : 'বাংলায় বলুন'}
            </button>
            <button
              type="button"
              onClick={stopListening}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/40 transition-colors flex items-center gap-1"
            >
              <MicOff className="w-3.5 h-3.5" />
              সম্পন্ন
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Input Bar */}
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/25 shadow-2xl backdrop-blur-xl transition-all">
        <textarea
          ref={textareaRef}
          value={input + (interimTranscript ? ` ${interimTranscript}` : '')}
          onChange={(e) => {
            setInput(e.target.value);
            setInterimTranscript('');
            baseInputBeforeSpeechRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="বাশার এআই-কে পৃথিবীর যেকোনো বিষয়ে প্রশ্ন করুন বা মুখে বলুন... (Shift + Enter নতুন লাইনের জন্য)"
          rows={1}
          className="w-full pt-3.5 pb-12 pl-4 pr-24 sm:pr-28 text-slate-100 placeholder-slate-400 bg-transparent resize-none text-[15px] outline-none leading-relaxed max-h-44 disabled:opacity-50"
        />

        {/* Action Buttons Toolbar at Bottom Inside */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {/* Left Info & Language Quick Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {isSupported && (
              <button
                type="button"
                onClick={handleLanguageToggle}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-white transition-colors border border-slate-700/50"
                title="ভয়েস ইনপুট ভাষা নির্বাচন"
              >
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>ভয়েস: {speechLanguage === 'bn-BD' ? 'বাংলা' : 'English'}</span>
              </button>
            )}

            {input.trim() && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/60 hover:bg-rose-950/40 text-[11px] text-slate-400 hover:text-rose-300 transition-colors"
                title="টেক্সট মুছে ফেলুন"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">মুছুন</span>
              </button>
            )}
          </div>

          {/* Right Action Icons: Microphone + Send Button */}
          <div className="flex items-center gap-2">
            {isSupported ? (
              <button
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                className={`relative p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-400/50 animate-pulse'
                    : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-indigo-600/40 hover:border-indigo-500/50 border border-slate-700/60'
                }`}
                title={
                  isListening
                    ? 'রেকর্ডিং বন্ধ করুন'
                    : `ভয়েস দিয়ে প্রশ্ন বলুন (${speechLanguage === 'bn-BD' ? 'বাংলা' : 'English'})`
                }
                aria-label="Voice-to-text input"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-indigo-300" />
                )}
              </button>
            ) : (
              <span
                className="p-2 text-slate-600 cursor-not-allowed"
                title="ব্রাউজারে ভয়েস রিকগনিশন সমর্থিত নয়"
              >
                <MicOff className="w-4 h-4" />
              </span>
            )}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!(input.trim() || interimTranscript.trim()) || isLoading || disabled}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                (input.trim() || interimTranscript.trim()) && !isLoading && !disabled
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-100'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
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

      <div className="mt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <Volume2 className="w-3 h-3 text-slate-500" />
        <span>
          মাইক্রোফোন চেপে মুখে কথা বলুন বা যেকোনো প্রশ্ন টাইপ করুন। বাশার এআই দ্রুত ইসলামিক শিষ্টাচারের সাথে উত্তর দেবে।
        </span>
      </div>
    </div>
  );
};
