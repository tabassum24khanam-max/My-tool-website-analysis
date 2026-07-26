'use client';

import type { TechResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue } from '@/components/metric-value';
import { Cpu } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'CMS': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Framework': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Analytics': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Payment': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'CDN': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Hosting': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Marketing': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Chat': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Security': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  'JavaScript': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export function TechSection({ data }: { data: TechResult }) {
  const grouped: Record<string, Array<{ name: string; website?: string }>> = {};

  if (data.technologies.status !== 'unavailable') {
    for (const tech of data.technologies.value) {
      const cat = tech.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(tech);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Technology Stack</CardTitle>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, techs]) => (
            <div key={category}>
              <p className="metric-label mb-2">{category}</p>
              <div className="flex flex-wrap gap-2">
                {techs.map((t) => (
                  <span
                    key={t.name}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <MetricValue
            metric={data.technologies}
            label=""
            size="sm"
            format={(v) => `${v.length} technologies detected`}
          />
        </div>
      ) : (
        <MetricValue
          metric={data.technologies}
          label="Technologies"
          size="sm"
          format={(v) => `${v.length} detected`}
        />
      )}
    </Card>
  );
}
