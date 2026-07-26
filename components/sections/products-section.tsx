'use client';

import type { ProductsResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, MetricBool, formatNumber, formatPercent, formatCurrency } from '@/components/metric-value';
import { ShoppingBag } from 'lucide-react';

export function ProductsSection({ data }: { data: ProductsResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Products & Business Model</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricValue metric={data.customerType} label="Customer Type" size="md" />
        <MetricValue metric={data.targetAudience} label="Target Audience" size="sm" />
        <MetricValue metric={data.pricingStrategy} label="Pricing Strategy" size="sm" />
        <MetricBool metric={data.hasSubscription} label="Subscription Model" />
        <MetricBool metric={data.hasFreeTrial} label="Free Trial" />
        <MetricValue metric={data.estimatedAOV} label="Avg Order Value" size="md" format={formatCurrency} />
        <MetricValue metric={data.estimatedMonthlySales} label="Est. Monthly Sales" size="md" format={formatNumber} />
        <MetricValue metric={data.estimatedYearlyRevenue} label="Est. Yearly Revenue" size="md" format={formatCurrency} />
        <MetricValue metric={data.estimatedConversionRate} label="Est. Conversion Rate" size="md" format={formatPercent} />
        <MetricValue
          metric={data.categories}
          label="Categories"
          size="sm"
          format={(v) => v.join(', ')}
        />
      </div>

      {data.products.status !== 'unavailable' && data.products.value.length > 0 && (
        <div className="mt-4">
          <p className="metric-label mb-2">Detected Products</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 text-left font-medium">Name</th>
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {data.products.value.slice(0, 10).map((p, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{p.category || '—'}</td>
                    <td className="py-2 text-right">{p.price || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
