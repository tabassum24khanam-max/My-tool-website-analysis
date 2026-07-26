'use client';

import { useState, useEffect } from 'react';
import type { Report } from '@/lib/types';
import { Header } from '@/components/header';
import { Card, CardTitle } from '@/components/ui/card';
import { formatNumber, formatCurrency } from '@/components/metric-value';
import { Plus, X, BarChart3 } from 'lucide-react';

function getMetricValue(report: Report, path: string): string {
  const parts = path.split('.');
  let current: unknown = report;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return '—';
    }
  }
  if (typeof current === 'object' && current !== null && 'status' in current) {
    const metric = current as { status: string; value?: unknown };
    if (metric.status === 'unavailable') return '—';
    const val = metric.value;
    if (typeof val === 'number') {
      if (path.includes('Revenue') || path.includes('AOV') || path.includes('Spend') || path.includes('Cost')) {
        return formatCurrency(val);
      }
      return formatNumber(val);
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return `${val.length} items`;
    return JSON.stringify(val);
  }
  return String(current ?? '—');
}

const COMPARISON_METRICS = [
  { label: 'Global Rank', path: 'traffic.globalRank' },
  { label: 'Monthly Visitors', path: 'traffic.estimatedMonthlyVisits' },
  { label: 'Bounce Rate', path: 'traffic.bounceRate' },
  { label: 'Domain Authority', path: 'seo.domainAuthority' },
  { label: 'Performance Score', path: 'seo.performanceScore' },
  { label: 'SEO Score', path: 'seo.seoScore' },
  { label: 'Technologies', path: 'tech.technologies' },
  { label: 'Social Accounts', path: 'social.accounts' },
  { label: 'Business Model', path: 'snapshot.businessModel' },
  { label: 'Industry', path: 'snapshot.industry' },
  { label: 'Free Trial', path: 'snapshot.freeTrial' },
  { label: 'Newsletter', path: 'marketing.hasNewsletter' },
  { label: 'Google Ads', path: 'ads.googleAds' },
  { label: 'Facebook Ads', path: 'ads.facebookAds' },
  { label: 'Est. Yearly Revenue', path: 'products.estimatedYearlyRevenue' },
  { label: 'Est. AOV', path: 'products.estimatedAOV' },
  { label: 'Est. Conversion Rate', path: 'products.estimatedConversionRate' },
  { label: 'Est. Customers', path: 'customers.estimatedCustomers' },
];

export default function ComparePage() {
  const [domains, setDomains] = useState<string[]>([]);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((d) => {
        const unique = Array.from(new Set((d.history || []).map((h: { domain: string }) => h.domain))) as string[];
        setSuggestions(unique.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const addDomain = async (domain: string) => {
    if (domains.includes(domain) || domains.length >= 4) return;
    setLoading(domain);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: domain }),
      });
      if (res.ok) {
        const report = await res.json();
        setReports((prev) => ({ ...prev, [report.domain]: report }));
        setDomains((prev) => [...prev, report.domain]);
      }
    } catch {}
    setLoading(null);
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    setDomains((prev) => prev.filter((d) => d !== domain));
    setReports((prev) => {
      const next = { ...prev };
      delete next[domain];
      return next;
    });
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold">Compare Companies</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {domains.map((d) => (
            <span
              key={d}
              className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
            >
              {d}
              <button onClick={() => removeDomain(d)}>
                <X size={14} />
              </button>
            </span>
          ))}
          {domains.length < 4 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newDomain.trim()) addDomain(newDomain.trim());
              }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="Add domain..."
                className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-1 text-sm outline-none"
                disabled={!!loading}
              />
              <button
                type="submit"
                disabled={!!loading || !newDomain.trim()}
                className="rounded-lg bg-brand-500 p-1 text-white disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Plus size={16} />
                )}
              </button>
            </form>
          )}
        </div>

        {suggestions.filter((s) => !domains.includes(s)).length > 0 && domains.length < 4 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs text-[var(--text-muted)] mr-1 self-center">Quick add:</span>
            {suggestions.filter((s) => !domains.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addDomain(s)}
                disabled={!!loading}
                className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs hover:border-brand-300 hover:text-brand-500 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {domains.length >= 2 && (
          <Card>
            <CardTitle>Side-by-Side Comparison</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left font-medium w-48">Metric</th>
                    {domains.map((d) => (
                      <th key={d} className="py-2 text-center font-medium">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_METRICS.map((metric) => (
                    <tr key={metric.path} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                      <td className="py-2 font-medium text-[var(--text-secondary)]">
                        {metric.label}
                      </td>
                      {domains.map((d) => (
                        <td key={d} className="py-2 text-center">
                          {reports[d] ? getMetricValue(reports[d], metric.path) : '...'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {domains.length < 2 && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Add at least 2 companies to compare</p>
          </div>
        )}
      </main>
    </>
  );
}
