'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Search, Clock, ArrowRight } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Array<{ domain: string; searched_at: number }>>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.history || []))
      .catch(() => {});
  }, []);

  const analyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const report = await res.json();
      router.push(`/report/${report.domain}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const uniqueHistory = history.filter(
    (h, i, arr) => arr.findIndex((a) => a.domain === h.domain) === i
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Website Intelligence Platform</h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Paste any company URL to get instant business intelligence
          </p>
        </div>

        <form onSubmit={analyze} className="relative mb-8">
          <div className="flex items-center rounded-xl border-2 border-[var(--border)] bg-[var(--bg-card)] shadow-sm focus-within:border-brand-500 transition-colors">
            <Search className="ml-4 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g. stripe.com)"
              className="flex-1 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-[var(--text-muted)]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="m-2 flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Analyze <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </form>

        {uniqueHistory.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] mb-3">
              <Clock size={14} /> Recent Searches
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {uniqueHistory.slice(0, 10).map((h) => (
                <button
                  key={h.domain + h.searched_at}
                  onClick={() => router.push(`/report/${h.domain}`)}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-left text-sm hover:border-brand-300 transition-colors"
                >
                  <span className="font-medium">{h.domain}</span>
                  <ArrowRight size={14} className="text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-4 text-center text-sm text-[var(--text-muted)] sm:grid-cols-4">
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
            <p className="text-2xl font-bold text-[var(--text-primary)]">13</p>
            <p>Analysis Modules</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
            <p className="text-2xl font-bold text-[var(--text-primary)]">100+</p>
            <p>Metrics Tracked</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
            <p className="text-2xl font-bold text-[var(--text-primary)]">Free</p>
            <p>API Sources</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
            <p className="text-2xl font-bold text-[var(--text-primary)]">AI</p>
            <p>Optional Mode</p>
          </div>
        </div>
      </main>
    </>
  );
}
