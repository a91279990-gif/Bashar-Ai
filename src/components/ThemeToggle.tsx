import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle, className = '' }) => {
  return (
    <button
      onClick={onToggle}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 dark:text-slate-400 dark:hover:text-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${className}`}
      title={isDark ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-45 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 text-slate-700 hover:text-indigo-600" />
      )}
    </button>
  );
};
