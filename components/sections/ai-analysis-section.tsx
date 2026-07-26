'use client';

import type { AiAnalysisResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue } from '@/components/metric-value';
import { Brain } from 'lucide-react';

export function AiAnalysisSection({ data }: { data: AiAnalysisResult }) {
  const allOff = data.businessSummary.status === 'unavailable' &&
    data.businessSummary.reason === 'AI mode is off';

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">AI Business Analysis</CardTitle>
      </div>

      {allOff ? (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
          <p className="text-[var(--text-secondary)]">
            Enable AI Mode to get business insights, SWOT analysis, and recommendations.
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Uses your DeepSeek API key — results are cached to minimize cost.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <MetricValue metric={data.businessSummary} label="Business Summary" size="sm" />
          <MetricValue metric={data.businessModel} label="Business Model" size="sm" />
          <MetricValue metric={data.revenueExplanation} label="Revenue Explanation" size="sm" />
          <MetricValue metric={data.marketingStrategy} label="Marketing Strategy" size="sm" />
          <MetricValue metric={data.salesStrategy} label="Sales Strategy" size="sm" />
          <MetricValue metric={data.contentStrategy} label="Content Strategy" size="sm" />

          {data.swot.status !== 'unavailable' && (
            <div>
              <p className="metric-label mb-2">SWOT Analysis</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Strengths</p>
                  <ul className="text-sm space-y-1">
                    {data.swot.value.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Weaknesses</p>
                  <ul className="text-sm space-y-1">
                    {data.swot.value.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Opportunities</p>
                  <ul className="text-sm space-y-1">
                    {data.swot.value.opportunities.map((o, i) => <li key={i}>• {o}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Threats</p>
                  <ul className="text-sm space-y-1">
                    {data.swot.value.threats.map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <MetricValue
            metric={data.growthOpportunities}
            label="Growth Opportunities"
            size="sm"
            format={(v) => v.join(' | ')}
          />
          <MetricValue
            metric={data.strengths}
            label="Key Strengths"
            size="sm"
            format={(v) => v.join(' | ')}
          />
          <MetricValue
            metric={data.weaknesses}
            label="Key Weaknesses"
            size="sm"
            format={(v) => v.join(' | ')}
          />
          <MetricValue
            metric={data.competitiveAdvantages}
            label="Competitive Advantages"
            size="sm"
            format={(v) => v.join(' | ')}
          />
          <MetricValue
            metric={data.recommendations}
            label="Recommendations"
            size="sm"
            format={(v) => v.join(' | ')}
          />
        </div>
      )}
    </Card>
  );
}
