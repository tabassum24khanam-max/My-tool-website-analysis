'use client';

import type { SnapshotResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, MetricBool } from '@/components/metric-value';
import { Building2 } from 'lucide-react';

export function SnapshotSection({ data, domain }: { data: SnapshotResult; domain: string }) {
  const logoValue = data.logoUrl.status !== 'unavailable' ? data.logoUrl.value : null;
  const screenshotValue = data.screenshotPath.status !== 'unavailable' ? data.screenshotPath.value : null;

  return (
    <Card>
      <div className="flex items-start gap-4 mb-4">
        {logoValue ? (
          <img src={logoValue} alt="Logo" className="h-12 w-12 rounded-lg object-contain" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900">
            <Building2 className="h-6 w-6 text-brand-600" />
          </div>
        )}
        <div>
          <CardTitle>Company Snapshot</CardTitle>
          <p className="text-sm text-[var(--text-muted)]">{domain}</p>
        </div>
      </div>

      {screenshotValue && (
        <div className="mb-4 overflow-hidden rounded-lg border border-[var(--border)]">
          <img
            src={`/api/screenshot/${domain}`}
            alt={`${domain} screenshot`}
            className="w-full"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricValue metric={data.companyName} label="Company Name" size="sm" />
        <MetricValue metric={data.description} label="Description" size="sm" />
        <MetricValue metric={data.industry} label="Industry" size="sm" />
        <MetricValue metric={data.businessModel} label="Business Model" size="sm" />
        <MetricValue metric={data.pricing} label="Pricing" size="sm" />
        <MetricBool metric={data.freeTrial} label="Free Trial / Free Plan" />
        <MetricValue metric={data.yearFounded} label="Year Founded" size="sm" />
        <MetricValue metric={data.founder} label="Founder" size="sm" />
        <MetricValue metric={data.headquarters} label="Headquarters" size="sm" />
        <MetricValue metric={data.employeeEstimate} label="Employees" size="sm" />
        <MetricValue
          metric={data.products}
          label="Products/Services"
          size="sm"
          format={(v) => v.join(', ')}
        />
        <MetricValue
          metric={data.subscriptionPlans}
          label="Plans"
          size="sm"
          format={(v) => v.join(', ')}
        />
        <MetricValue
          metric={data.countriesServed}
          label="Countries"
          size="sm"
          format={(v) => v.join(', ')}
        />
        <MetricValue
          metric={data.contactEmails}
          label="Email"
          size="sm"
          format={(v) => v.join(', ')}
        />
        <MetricValue
          metric={data.contactPhones}
          label="Phone"
          size="sm"
          format={(v) => v.join(', ')}
        />
      </div>
    </Card>
  );
}
