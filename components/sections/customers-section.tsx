'use client';

import type { CustomersResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, formatNumber, formatPercent, formatCurrency } from '@/components/metric-value';
import { UserCheck } from 'lucide-react';

export function CustomersSection({ data }: { data: CustomersResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Customer Insights</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricValue metric={data.estimatedCustomers} label="Est. Customers" size="lg" format={formatNumber} />
        <MetricValue metric={data.returningRate} label="Returning Rate" size="md" format={formatPercent} />
        <MetricValue metric={data.purchaseFrequency} label="Purchase Frequency" size="md" />
        <MetricValue metric={data.avgOrderValue} label="Avg Order Value" size="md" format={formatCurrency} />
        <MetricValue metric={data.conversionRate} label="Conversion Rate" size="md" format={formatPercent} />
        <MetricValue metric={data.cartAbandonment} label="Cart Abandonment" size="md" format={formatPercent} />
        <MetricValue metric={data.customerAcquisitionCost} label="Est. CAC" size="md" format={formatCurrency} />
      </div>
    </Card>
  );
}
