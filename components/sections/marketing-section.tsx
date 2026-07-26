'use client';

import type { MarketingResult } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, MetricBool } from '@/components/metric-value';
import { Megaphone } from 'lucide-react';

export function MarketingSection({ data }: { data: MarketingResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Marketing Analysis</CardTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricBool metric={data.hasNewsletter} label="Newsletter" />
        <MetricBool metric={data.emailCapture} label="Email Capture" />
        <MetricBool metric={data.hasPopups} label="Popups" />
        <MetricBool metric={data.hasDiscounts} label="Discounts / Offers" />
        <MetricBool metric={data.hasReferralProgram} label="Referral Programme" />
        <MetricBool metric={data.hasAffiliateProgram} label="Affiliate Programme" />
        <MetricValue
          metric={data.couponCodes}
          label="Coupon Codes"
          size="sm"
          format={(v) => v.length > 0 ? v.join(', ') : 'None found'}
        />
        <MetricValue
          metric={data.leadMagnets}
          label="Lead Magnets"
          size="sm"
          format={(v) => v.length > 0 ? v.join(', ') : 'None found'}
        />
        <MetricValue
          metric={data.ctas}
          label="Top CTAs"
          size="sm"
          format={(v) => v.slice(0, 5).join(', ')}
        />
        <MetricValue metric={data.marketingStrategy} label="Strategy" size="sm" />
        <MetricValue metric={data.salesFunnel} label="Sales Funnel" size="sm" />
      </div>
    </Card>
  );
}
