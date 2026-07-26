'use client';

import type { SocialResult, SocialAccount } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/card';
import { MetricValue, formatNumber, formatPercent } from '@/components/metric-value';
import { Users } from 'lucide-react';

function AccountCard({ account }: { account: SocialAccount }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-2">
        <a
          href={account.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-500 hover:underline"
        >
          {account.platform}
        </a>
        <span className="text-sm text-[var(--text-muted)]">@{account.handle}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricValue metric={account.followers} label="Followers" size="sm" format={formatNumber} />
        <MetricValue metric={account.engagementRate} label="Engagement" size="sm" format={formatPercent} />
        <MetricValue metric={account.avgLikes} label="Avg Likes" size="sm" format={formatNumber} />
        <MetricValue metric={account.avgComments} label="Avg Comments" size="sm" format={formatNumber} />
        <MetricValue metric={account.avgViews} label="Avg Views" size="sm" format={formatNumber} />
        <MetricValue metric={account.postingFrequency} label="Frequency" size="sm" />
      </div>
    </div>
  );
}

export function SocialSection({ data }: { data: SocialResult }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-brand-500" />
        <CardTitle className="!mb-0">Social Media</CardTitle>
      </div>

      {data.accounts.status !== 'unavailable' && data.accounts.value.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.accounts.value.map((acc) => (
            <AccountCard key={acc.platform} account={acc} />
          ))}
        </div>
      ) : (
        <MetricValue
          metric={data.accounts}
          label="Social Accounts"
          size="sm"
          format={(v) => `${v.length} accounts found`}
        />
      )}
    </Card>
  );
}
