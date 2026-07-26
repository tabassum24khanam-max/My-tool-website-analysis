'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';

export default function SavedPage() {
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/saved')
      .then((r) => r.json())
      .then((d) => setSaved(d.saved || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (domain: string) => {
    setSaved((prev) => prev.filter((d) => d !== domain));
    await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, action: 'remove' }),
    }).catch(() => {
      setSaved((prev) => [...prev, domain]);
    });
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Bookmark className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold">Saved Companies</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[var(--text-muted)]">Loading...</div>
        ) : saved.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Bookmark className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No saved companies yet</p>
            <p className="text-sm mt-1">Save companies from their report pages</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {saved.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
              >
                <button
                  onClick={() => router.push(`/report/${domain}`)}
                  className="flex-1 text-left font-medium hover:text-brand-500 transition-colors"
                >
                  {domain}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => remove(domain)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => router.push(`/report/${domain}`)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
