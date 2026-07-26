import type { TrafficSourcesResult, CrawlResult } from '@/lib/types';
import { estimated } from '@/lib/types';

interface SourceBaseline {
  source: string;
  base: number;
}

const DEFAULT_SOURCES: SourceBaseline[] = [
  { source: 'Direct', base: 25 },
  { source: 'Organic Search', base: 30 },
  { source: 'Paid Search', base: 8 },
  { source: 'Social', base: 12 },
  { source: 'Referral', base: 10 },
  { source: 'Email', base: 8 },
  { source: 'Display', base: 4 },
  { source: 'Affiliate', base: 3 },
];

export async function analyzeTrafficSources(crawl: CrawlResult): Promise<TrafficSourcesResult> {
  const html = crawl.allHtml.toLowerCase();
  const scripts = crawl.scripts.join(' ').toLowerCase();
  const adjustments: Record<string, number> = {};

  const hasBlog = crawl.pages.some((p) => p.url.includes('blog')) ||
    html.includes('/blog') || crawl.sitemapUrls.some((u) => u.includes('blog'));
  if (hasBlog) {
    adjustments['Organic Search'] = (adjustments['Organic Search'] || 0) + 8;
    adjustments['Direct'] = (adjustments['Direct'] || 0) - 3;
  }

  const hasAdPixels = scripts.includes('googleads') || scripts.includes('googlesyndication') ||
    scripts.includes('fbevents') || scripts.includes('analytics.tiktok');
  if (hasAdPixels) {
    adjustments['Paid Search'] = (adjustments['Paid Search'] || 0) + 6;
    adjustments['Display'] = (adjustments['Display'] || 0) + 3;
    adjustments['Direct'] = (adjustments['Direct'] || 0) - 4;
  }

  const hasSocialLinks = html.includes('instagram.com') || html.includes('tiktok.com') ||
    html.includes('twitter.com') || html.includes('facebook.com') || html.includes('linkedin.com');
  if (hasSocialLinks) {
    adjustments['Social'] = (adjustments['Social'] || 0) + 5;
    adjustments['Direct'] = (adjustments['Direct'] || 0) - 2;
  }

  const hasNewsletter = html.includes('newsletter') || html.includes('subscribe') ||
    scripts.includes('mailchimp') || scripts.includes('klaviyo') || scripts.includes('convertkit');
  if (hasNewsletter) {
    adjustments['Email'] = (adjustments['Email'] || 0) + 5;
    adjustments['Direct'] = (adjustments['Direct'] || 0) - 2;
  }

  const hasAffiliate = html.includes('/affiliates') || html.includes('/partners') ||
    html.includes('affiliate program');
  if (hasAffiliate) {
    adjustments['Affiliate'] = (adjustments['Affiliate'] || 0) + 4;
    adjustments['Direct'] = (adjustments['Direct'] || 0) - 2;
  }

  const adjusted = DEFAULT_SOURCES.map((s) => ({
    source: s.source,
    percentage: Math.max(1, s.base + (adjustments[s.source] || 0)),
  }));

  const total = adjusted.reduce((sum, s) => sum + s.percentage, 0);
  const normalized = adjusted.map((s) => ({
    source: s.source,
    percentage: Math.round((s.percentage / total) * 1000) / 10,
  }));

  const signals: string[] = [];
  if (hasBlog) signals.push('blog detected (+organic)');
  if (hasAdPixels) signals.push('ad pixels detected (+paid)');
  if (hasSocialLinks) signals.push('social links found (+social)');
  if (hasNewsletter) signals.push('newsletter/email tools detected (+email)');
  if (hasAffiliate) signals.push('affiliate program found (+affiliate)');

  return {
    sources: estimated(
      normalized,
      'low',
      `Industry benchmark baseline adjusted by detected signals: ${signals.length > 0 ? signals.join('; ') : 'no adjustments'}`
    ),
  };
}
