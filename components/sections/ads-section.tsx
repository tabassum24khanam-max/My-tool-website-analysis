'use client';

import type { AdsResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, MetricBool, formatCurrency } from '@/components/metric-value';
import { Tv } from 'lucide-react';

export function AdsSection({ data }: { data: AdsResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Tv className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Advertising</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricBool metric={data.googleAds} label="Google Ads" trueLabel="Detected" falseLabel="Not detected" />
        <MetricBool metric={data.facebookAds} label="Facebook Ads" trueLabel="Detected" falseLabel="Not detected" />
        <MetricBool metric={data.tiktokAds} label="TikTok Ads" trueLabel="Detected" falseLabel="Not detected" />
        <MetricBool metric={data.linkedinAds} label="LinkedIn Ads" trueLabel="Detected" falseLabel="Not detected" />
        <MetricBool metric={data.pinterestAds} label="Pinterest Ads" trueLabel="Detected" falseLabel="Not detected" />
        <MetricBool metric={data.twitterAds} label="X Ads" trueLabel="Detected" falseLabel="Not detected" />
        <MetricValue
          metric={data.detectedPixels}
          label="Tracking Pixels"
          size="sm"
          format={(v) => v.length > 0 ? v.join(', ') : 'None detected'}
        />
        <MetricValue metric={data.estimatedAdSpend} label="Est. Monthly Ad Spend" size="md" format={formatCurrency} />
      </div>

      {data.metaAdLibrary.status !== 'unavailable' && data.metaAdLibrary.value.length > 0 && (
        <div className="mt-4">
          <p className="metric-label mb-2">Meta Ad Library</p>
          <div className="space-y-2">
            {data.metaAdLibrary.value.slice(0, 5).map((ad, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <p>{ad.body}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {ad.startDate} — {ad.endDate || 'Active'} | {ad.platforms.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
