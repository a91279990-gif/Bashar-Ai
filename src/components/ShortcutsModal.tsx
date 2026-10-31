import React from 'react';
import { X, Command, Keyboard, Zap } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const metaKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'চ্যাট ও কথোপকথন',
      items: [
        {
          keys: [metaKey, 'K'],
          title: 'নতুন চ্যাট শুরু করুন',
          description: 'তাৎক্ষণিক একটি নতুন পরিষ্কার কথোপকথন উইন্ডো খুলবে এবং ইনপুটে ফোকাস করবে',
        },
        {
          keys: [metaKey, 'L'],
          title: 'ইনপুট বক্সে ফোকাস করুন',
          description: 'যেকোনো স্থান থেকে সরাসরি প্রশ্ন লেখার জন্য চ্যাট ইনপুট বক্সে কার্সার নিয়ে যাবে',
        },
        {
          keys: [metaKey, 'S'],
          title: 'কথোপকথন ডাউনলোড / এক্সপোর্ট',
          description: 'বর্তমান চ্যাট হিস্ট্রি Markdown ফাইল (.md) আকারে ডাউনলোড করবে',
        },
        {
          keys: ['Enter'],
          title: 'বার্তা পাঠান',
          description: 'আপনার টাইপ করা প্রশ্ন বাশার এআই-এর কাছে পাঠাবে',
        },
        {
          keys: ['Shift', 'Enter'],
          title: 'নতুন লাইন যুক্ত করুন',
          description: 'বার্তা না পাঠিয়ে ইনপুট বক্সে পরবর্তী লাইন তৈরি করবে',
        },
      ],
    },
    {
      category: 'নেভিগেশন ও টুলস',
      items: [
        {
          keys: [metaKey, 'F'],
          title: 'কথোপকথন খুঁজুন (সার্চ)',
          description: 'সাইডবারের সার্চ বারে সরাসরি কার্সার নিয়ে যাবে এবং শিরোনাম দিয়ে চ্যাট ফিল্টার করবে',
        },
        {
          keys: [metaKey, 'B'],
          title: 'সাইডবার টগল করুন',
          description: 'বাম পাশের চ্যাট হিস্ট্রি সাইডবার খুলুন বা লুকান',
        },
        {
          keys: [metaKey, 'Shift', 'N'],
          title: 'নোটবুক ওপেন করুন',
          description: 'সংরক্ষিত নোট দেখা ও নতুন নোট লেখার প্যানেল খুলবে',
        },
        {
          keys: [metaKey, 'Shift', 'D'],
          title: 'ডার্ক / লাইট মোড টগল',
          description: 'অ্যাপ্লিকেশনের থিম পরিবর্তন করবে',
        },
        {
          keys: [metaKey, '/'],
          title: 'কীবোর্ড শর্টকাট সহায়িকা',
          description: 'এই শর্টকাট তালিকা প্রদর্শন করবে',
        },
        {
          keys: ['Esc'],
          title: 'মডেল / উইন্ডো বন্ধ করুন',
          description: 'খোলা থাকা যেকোনো পপআপ বা ডায়ালগ বন্ধ করবে',
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                কীবোর্ড শর্টকাট সহায়িকা
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  Global Shortcuts
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                বাশার এআই দ্রুত ও মসৃণভাবে ব্যবহারের শর্টকাটসমূহ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {section.category}
              </h4>
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 text-xs font-semibold font-mono bg-slate-800 text-indigo-300 border border-slate-700/80 rounded-md shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>টিপস: যেকোনো সময় <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">{metaKey} + /</kbd> চেপে এটি খুলতে পারবেন।</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
          >
            বুঝেছি
          </button>
        </div>
      </div>
    </div>
  );
};
