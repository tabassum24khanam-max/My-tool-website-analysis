'use client';

import type { TrafficResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, formatNumber, formatPercent } from '@/components/metric-value';
import { TrendingUp } from 'lucide-react';

export function TrafficSection({ data }: { data: TrafficResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Website Traffic</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricValue metric={data.globalRank} label="Global Rank" size="lg" format={formatNumber} />
        <MetricValue metric={data.estimatedMonthlyVisits} label="Monthly Visitors" size="lg" format={formatNumber} />
        <MetricValue metric={data.dailyVisits} label="Daily Visitors" size="md" format={formatNumber} />
        <MetricValue metric={data.weeklyVisits} label="Weekly Visitors" size="md" format={formatNumber} />
        <MetricValue metric={data.yearlyVisits} label="Yearly Visitors" size="md" format={formatNumber} />
        <MetricValue metric={data.visitTrend} label="Trend" size="md" />
        <MetricValue metric={data.growthPercentage} label="Growth" size="md" format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />
        <MetricValue metric={data.pagesPerVisit} label="Pages / Visit" size="md" format={(v) => v.toFixed(1)} />
        <MetricValue metric={data.avgSessionDuration} label="Avg Session" size="md" />
        <MetricValue metric={data.bounceRate} label="Bounce Rate" size="md" format={formatPercent} />
        <MetricValue
          metric={data.deviceSplit}
          label="Device Split"
          size="sm"
          format={(v) => `Desktop ${v.desktop}% / Mobile ${v.mobile}% / Tablet ${v.tablet}%`}
        />
        <MetricValue
          metric={data.newVsReturning}
          label="New vs Returning"
          size="sm"
          format={(v) => `New ${v.new}% / Returning ${v.returning}%`}
        />
      </div>

      {data.topCountries.status !== 'unavailable' && (
        <div className="mt-4">
          <p className="metric-label mb-2">Top Countries</p>
          <div className="space-y-1">
            {data.topCountries.value.slice(0, 5).map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span>{c.country}</span>
                <span className="font-medium">{c.share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
