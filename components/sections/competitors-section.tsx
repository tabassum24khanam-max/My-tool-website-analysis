'use client';

import type { CompetitorsResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, formatNumber } from '@/components/metric-value';
import { Swords } from 'lucide-react';

export function CompetitorsSection({ data }: { data: CompetitorsResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Swords className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Competitors</CardTitle>
      </div>

      <MetricValue metric={data.source} label="Discovery Method" size="sm" />

      {data.competitors.status !== 'unavailable' && data.competitors.value.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 text-left font-medium">Domain</th>
                <th className="py-2 text-right font-medium">Traffic</th>
                <th className="py-2 text-right font-medium">Rank</th>
                <th className="py-2 text-right font-medium">Tech Count</th>
              </tr>
            </thead>
            <tbody>
              {data.competitors.value.map((c) => (
                <tr key={c.domain} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium text-brand-500">{c.domain}</td>
                  <td className="py-2 text-right">
                    {c.traffic.status !== 'unavailable' ? formatNumber(c.traffic.value) : '—'}
                  </td>
                  <td className="py-2 text-right">
                    {c.rank.status !== 'unavailable' ? formatNumber(c.rank.value) : '—'}
                  </td>
                  <td className="py-2 text-right">
                    {c.techCount.status !== 'unavailable' ? c.techCount.value : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <MetricValue
          metric={data.competitors}
          label="Competitors"
          size="sm"
          format={(v) => `${v.length} competitors found`}
        />
      )}
    </Card>
  );
}
