'use client';

import type { TrafficSourcesResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue } from '@/components/metric-value';
import { PieChart } from 'lucide-react';

const SOURCE_COLORS: Record<string, string> = {
  'Direct': 'bg-blue-500',
  'Organic Search': 'bg-green-500',
  'Paid Search': 'bg-purple-500',
  'Social': 'bg-pink-500',
  'Referral': 'bg-orange-500',
  'Email': 'bg-cyan-500',
  'Display': 'bg-yellow-500',
  'Affiliate': 'bg-red-500',
};

export function TrafficSourcesSection({ data }: { data: TrafficSourcesResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Traffic Sources</CardTitle>
      </div>

      {data.sources.status !== 'unavailable' ? (
        <div className="space-y-3">
          {data.sources.value.map((s) => (
            <div key={s.source}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{s.source}</span>
                <span className="text-sm font-medium">{s.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-2 rounded-full ${SOURCE_COLORS[s.source] || 'bg-slate-400'}`}
                  style={{ width: `${Math.min(s.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="mt-2">
            <MetricValue
              metric={data.sources}
              label=""
              size="sm"
              format={() => `${data.sources.status !== 'unavailable' ? data.sources.value.length : 0} sources detected`}
            />
          </div>
        </div>
      ) : (
        <MetricValue metric={data.sources} label="Traffic Sources" size="sm" format={() => ''} />
      )}
    </Card>
  );
}
