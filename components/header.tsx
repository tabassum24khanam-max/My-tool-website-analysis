'use client';

import { useTheme } from '@/components/theme-provider';
import { Moon, Sun, Zap, Bot } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, toggle } = useTheme();
  const [aiMode, setAiMode] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setAiMode(d.aiMode))
      .catch(() => {});
  }, []);

  const toggleAi = async () => {
    const next = !aiMode;
    setAiMode(next);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiMode: next }),
    }).catch(() => setAiMode(!next));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2 text-lg font-bold">
          <Zap className="h-5 w-5 text-brand-500" />
          <span className="hidden sm:inline">Website Intelligence</span>
        </a>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleAi}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              aiMode
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {aiMode ? (
              <>
                <Zap size={14} /> AI ON
              </>
            ) : (
              <>
                <Bot size={14} /> Bot Mode
              </>
            )}
          </button>

          <button
            onClick={toggle}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
