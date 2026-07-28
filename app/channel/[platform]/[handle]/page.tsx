'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ChannelReport } from '@/lib/channel-pipeline';
import { Header } from '@/components/header';
import { Card, CardTitle } from '@/components/ui/card';
import { SectionSkeleton } from '@/components/ui/skeleton';
import { MetricValue, formatNumber } from '@/components/metric-value';
import { VideoSection } from '@/components/sections/video-section';
import { ArrowLeft, RefreshCw, Info, ExternalLink } from 'lucide-react';

const PLATFORM_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
};

const PROFILE_URL: Record<string, (h: string) => string> = {
  youtube: (h) => `https://www.youtube.com/@${h}`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  instagram: (h) => `https://www.instagram.com/${h}/`,
};

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const platform = String(params.platform);
  const handle = decodeURIComponent(String(params.handle));

  const [report, setReport] = useState<ChannelReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const profileUrl = (PROFILE_URL[platform] ?? PROFILE_URL.youtube)(handle);
      const res = await fetch('/api/analyze-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: profileUrl, refresh }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze channel');

      setReport(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channel');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, handle]);

  const label = PLATFORM_LABEL[platform] ?? platform;

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
              <h1 className="text-2xl font-bold">@{handle}</h1>
              <p className="text-sm text-[var(--text-muted)]">
                {label} channel
                {report && ` · analyzed ${new Date(report.analyzedAt).toLocaleString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <a
                href={report.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ExternalLink size={14} />
                Profile
              </a>
            )}
            <button
              onClick={() => fetchReport(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
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
            {Array.from({ length: 3 }).map((_, i) => (
              <SectionSkeleton key={i} />
            ))}
          </div>
        ) : report ? (
          <div className="space-y-6">
            {report.note && (
              <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                <Info size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium mb-1">{label} statistics are not available</p>
                  <p>{report.note}</p>
                </div>
              </div>
            )}

            {report.platform === 'youtube' && (
              <Card>
                <CardTitle>Channel Overview</CardTitle>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <MetricValue metric={report.video.channelName} label="Channel" />
                  <MetricValue
                    metric={report.video.subscribers}
                    label="Subscribers"
                    format={formatNumber}
                  />
                  <MetricValue
                    metric={report.video.totalVideos}
                    label="Total Videos"
                    format={formatNumber}
                  />
                  <MetricValue
                    metric={report.video.avgViews}
                    label="Avg Views"
                    format={formatNumber}
                  />
                </div>
              </Card>
            )}

            <VideoSection data={report.video} />
          </div>
        ) : null}
      </main>
    </>
  );
}
