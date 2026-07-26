'use client';

import type { SeoResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, MetricBool, formatNumber } from '@/components/metric-value';
import { Search } from 'lucide-react';

function ScoreGauge({ label, metric }: { label: string; metric: SeoResult['performanceScore'] }) {
  if (metric.status === 'unavailable') {
    return <MetricValue metric={metric} label={label} size="sm" />;
  }
  const score = metric.value;
  const color = score >= 90 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{score}</div>
      <p className="metric-label">{label}</p>
      <span className={metric.status === 'measured' ? 'badge-measured' : 'badge-estimated'}>
        {metric.status === 'measured' ? 'Measured' : 'Estimate'}
      </span>
    </div>
  );
}

export function SeoSection({ data }: { data: SeoResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">SEO & Performance</CardTitle>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 mb-6">
        <ScoreGauge label="Performance" metric={data.performanceScore} />
        <ScoreGauge label="SEO" metric={data.seoScore} />
        <ScoreGauge label="Accessibility" metric={data.accessibilityScore} />
        <ScoreGauge label="Best Practices" metric={data.bestPracticesScore} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricValue metric={data.domainAuthority} label="Domain Authority" size="md" format={(v) => `${v}/10`} />
        <MetricBool metric={data.sslCert} label="SSL Certificate" trueLabel="Valid" falseLabel="Missing" />
        <MetricBool metric={data.hasRobotsTxt} label="robots.txt" trueLabel="Present" falseLabel="Missing" />
        <MetricBool metric={data.hasSitemap} label="Sitemap" trueLabel="Present" falseLabel="Missing" />
        <MetricBool metric={data.mobileFriendly} label="Mobile Friendly" />
        <MetricValue metric={data.indexablePages} label="Indexable Pages" size="sm" format={formatNumber} />
        <MetricValue metric={data.internalLinks} label="Internal Links" size="sm" format={formatNumber} />
        <MetricValue metric={data.externalLinks} label="External Links" size="sm" format={formatNumber} />
        <MetricValue metric={data.titleTag} label="Title Tag" size="sm" />
        <MetricValue metric={data.metaDescription} label="Meta Description" size="sm" />
        <MetricValue metric={data.canonicalUrl} label="Canonical" size="sm" />
        <MetricValue
          metric={data.h1Tags}
          label="H1 Tags"
          size="sm"
          format={(v) => v.join(', ')}
        />
      </div>

      {data.coreWebVitals.status !== 'unavailable' && (
        <div className="mt-4">
          <p className="metric-label mb-2">Core Web Vitals</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)]">LCP</p>
              <p className="text-lg font-semibold">{data.coreWebVitals.value.lcp.toFixed(1)}s</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">FID</p>
              <p className="text-lg font-semibold">{data.coreWebVitals.value.fid}ms</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">CLS</p>
              <p className="text-lg font-semibold">{data.coreWebVitals.value.cls.toFixed(3)}</p>
            </div>
          </div>
        </div>
      )}

      {data.onSiteKeywords.status !== 'unavailable' && data.onSiteKeywords.value.length > 0 && (
        <div className="mt-4">
          <p className="metric-label mb-2">Top On-Site Keywords</p>
          <div className="flex flex-wrap gap-2">
            {data.onSiteKeywords.value.slice(0, 15).map((kw) => (
              <span
                key={kw.keyword}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
              >
                {kw.keyword} ({kw.frequency})
              </span>
            ))}
          </div>
        </div>
      )}

      {data.brokenLinks.status !== 'unavailable' && data.brokenLinks.value.length > 0 && (
        <div className="mt-4">
          <p className="metric-label mb-2">Broken Links ({data.brokenLinks.value.length})</p>
          <ul className="text-sm text-red-500 space-y-1">
            {data.brokenLinks.value.slice(0, 5).map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
