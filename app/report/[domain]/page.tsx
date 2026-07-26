'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Report } from '@/lib/types';
import { Header } from '@/components/header';
import { SectionSkeleton } from '@/components/ui/skeleton';
import { SnapshotSection } from '@/components/sections/snapshot-section';
import { TrafficSection } from '@/components/sections/traffic-section';
import { TrafficSourcesSection } from '@/components/sections/traffic-sources-section';
import { ProductsSection } from '@/components/sections/products-section';
import { MarketingSection } from '@/components/sections/marketing-section';
import { AdsSection } from '@/components/sections/ads-section';
import { SocialSection } from '@/components/sections/social-section';
import { VideoSection } from '@/components/sections/video-section';
import { SeoSection } from '@/components/sections/seo-section';
import { CompetitorsSection } from '@/components/sections/competitors-section';
import { TechSection } from '@/components/sections/tech-section';
import { CustomersSection } from '@/components/sections/customers-section';
import { AiAnalysisSection } from '@/components/sections/ai-analysis-section';
import { ArrowLeft, RefreshCw, Download, Bookmark, BookmarkCheck } from 'lucide-react';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fetchReport = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: domain, refresh }),
      });

      if (!res.ok) throw new Error('Failed to analyze');

      const data = await res.json();
      setReport(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
    fetch('/api/saved')
      .then((r) => r.json())
      .then((d) => {
        if ((d.saved || []).includes(domain)) setSaved(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, action: next ? 'save' : 'remove' }),
    }).catch(() => setSaved(!next));
  };

  const exportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{domain}</h1>
              {report && (
                <p className="text-sm text-[var(--text-muted)]">
                  Analyzed {new Date(report.analyzedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSave}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                saved
                  ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                  : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => fetchReport(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={exportJson}
              disabled={!report}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <SectionSkeleton key={i} />
            ))}
          </div>
        ) : report ? (
          <div className="space-y-6">
            <SnapshotSection data={report.snapshot} domain={report.domain} />
            <TrafficSection data={report.traffic} />
            <TrafficSourcesSection data={report.trafficSources} />
            <ProductsSection data={report.products} />
            <MarketingSection data={report.marketing} />
            <AdsSection data={report.ads} />
            <SocialSection data={report.social} />
            <VideoSection data={report.video} />
            <SeoSection data={report.seo} />
            <CompetitorsSection data={report.competitors} />
            <TechSection data={report.tech} />
            <CustomersSection data={report.customers} />
            <AiAnalysisSection data={report.aiAnalysis} />
          </div>
        ) : null}
      </main>
    </>
  );
}
