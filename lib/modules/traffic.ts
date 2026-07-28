import type { TrafficResult, CrawlResult } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/utils';
import { storeTrafficSnapshot, getTrafficHistory } from '@/lib/db';

interface BenchmarkSet {
  bounceRate: number;
  pagesPerVisit: number;
  avgSessionSeconds: number;
  newVisitorPct: number;
  desktop: number;
  mobile: number;
  tablet: number;
}

const INDUSTRY_BENCHMARKS: Record<string, BenchmarkSet> = {
  default: { bounceRate: 47, pagesPerVisit: 3.2, avgSessionSeconds: 195, newVisitorPct: 62, desktop: 55, mobile: 40, tablet: 5 },
  ecommerce: { bounceRate: 42, pagesPerVisit: 4.5, avgSessionSeconds: 225, newVisitorPct: 55, desktop: 45, mobile: 50, tablet: 5 },
  saas: { bounceRate: 52, pagesPerVisit: 3.0, avgSessionSeconds: 180, newVisitorPct: 65, desktop: 65, mobile: 30, tablet: 5 },
  media: { bounceRate: 55, pagesPerVisit: 2.5, avgSessionSeconds: 160, newVisitorPct: 70, desktop: 50, mobile: 45, tablet: 5 },
  blog: { bounceRate: 60, pagesPerVisit: 1.8, avgSessionSeconds: 120, newVisitorPct: 75, desktop: 50, mobile: 45, tablet: 5 },
};

/**
 * Monthly visits ≈ 38.5B / rank, a Zipf fit regressed over published traffic
 * figures spanning rank 1 to rank ~2000.
 *
 * The previous 5B/rank^0.88 × 30 curve overshot badly at the ranks most sites
 * fall in: 22x for shopify.com and 35x for stripe.com. This fit holds those to
 * roughly 5x in the worst case.
 *
 * Even so this is an order-of-magnitude figure, not a measurement. Tranco and
 * Radar rank domain popularity — which counts embedded scripts, API hosts and
 * DNS lookups — not human page views, so infrastructure domains rank far above
 * their actual readership. stripe.com ranks 236 with ~35M monthly visits while
 * notion.so ranks 1865 with more; no rank-based curve can order those correctly.
 * Every value derived from this is reported as a low-confidence estimate.
 */
function rankToVisits(rank: number): number {
  if (rank <= 0) return 0;
  return Math.round(38_562_435_047 / Math.pow(rank, 1.0));
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

async function fetchTrancoRank(domain: string): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      `https://tranco-list.eu/api/ranks/domain/${domain}`,
      { timeoutMs: 10000 }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.ranks && data.ranks.length > 0) {
      return data.ranks[0].rank;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCloudflareRank(domain: string): Promise<number | null> {
  const token = process.env.CLOUDFLARE_RADAR_TOKEN;
  if (!token) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.cloudflare.com/client/v4/radar/ranking/domain/${domain}`,
      {
        timeoutMs: 10000,
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result?.details?.[0]?.categories?.[0]?.rank) {
      return data.result.details[0].categories[0].rank;
    }
    return null;
  } catch {
    return null;
  }
}

export async function analyzeTraffic(crawl: CrawlResult): Promise<TrafficResult> {
  const domain = crawl.domain;

  const [trancoRank, cfRank] = await Promise.all([
    fetchTrancoRank(domain),
    fetchCloudflareRank(domain),
  ]);

  const rank = trancoRank || cfRank;
  const rankSource = trancoRank
    ? cfRank
      ? 'Tranco + Cloudflare Radar'
      : 'Tranco'
    : cfRank
      ? 'Cloudflare Radar'
      : null;

  if (!rank) {
    storeTrafficSnapshot(domain, null, null);
    return {
      globalRank: unavailable('Domain not found in Tranco top-1M or Cloudflare Radar rankings'),
      estimatedMonthlyVisits: unavailable('No rank data available to estimate traffic'),
      dailyVisits: unavailable('No rank data'),
      weeklyVisits: unavailable('No rank data'),
      yearlyVisits: unavailable('No rank data'),
      visitTrend: unavailable('Need at least 2 analyses to show trend'),
      growthPercentage: unavailable('Need at least 2 analyses to show growth'),
      newVsReturning: estimated(
        { new: 62, returning: 38 },
        'low',
        'Industry benchmark average (62% new visitors)'
      ),
      pagesPerVisit: estimated(3.2, 'low', 'Cross-industry benchmark average'),
      avgSessionDuration: estimated(formatDuration(195), 'low', 'Cross-industry benchmark average'),
      bounceRate: estimated(47, 'low', 'Cross-industry benchmark average'),
      topCountries: unavailable('Requires Cloudflare Radar token or paid analytics'),
      deviceSplit: estimated(
        { desktop: 55, mobile: 40, tablet: 5 },
        'low',
        'Cross-industry benchmark average'
      ),
    };
  }

  const monthlyVisits = rankToVisits(rank);
  const dailyVisits = Math.round(monthlyVisits / 30);
  const weeklyVisits = Math.round(monthlyVisits / 4.3);
  const yearlyVisits = monthlyVisits * 12;

  storeTrafficSnapshot(domain, rank, monthlyVisits);

  const history = getTrafficHistory(domain);
  let visitTrend: TrafficResult['visitTrend'] = unavailable(
    'Need at least 2 analyses to show trend — re-analyze later to build history'
  );
  let growthPercentage: TrafficResult['growthPercentage'] = unavailable(
    'Need at least 2 analyses'
  );

  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    if (prev.est_monthly_visits && curr.est_monthly_visits) {
      const change =
        ((curr.est_monthly_visits - prev.est_monthly_visits) / prev.est_monthly_visits) *
        100;
      visitTrend = measured(
        change > 2 ? 'Growing' : change < -2 ? 'Declining' : 'Stable',
        'Self-accumulated traffic history'
      );
      growthPercentage = measured(
        Math.round(change * 10) / 10,
        'Self-accumulated traffic history'
      );
    }
  }

  // Rank measures domain popularity rather than page views, so agreement
  // between two rank sources does not make the derived traffic figure reliable.
  // These stay low-confidence regardless.
  const confidence = 'low' as const;

  const benchmarks = INDUSTRY_BENCHMARKS.default;

  return {
    globalRank: measured(rank, rankSource!),
    estimatedMonthlyVisits: estimated(
      monthlyVisits,
      confidence,
      `Zipf model: 38.5B / rank (rank=${rank} from ${rankSource}). Order of magnitude only — rank counts domain popularity, including embedded scripts and API hosts, not human visits. Expect several-fold error.`
    ),
    dailyVisits: estimated(dailyVisits, confidence, 'Monthly estimate / 30'),
    weeklyVisits: estimated(weeklyVisits, confidence, 'Monthly estimate / 4.3'),
    yearlyVisits: estimated(yearlyVisits, confidence, 'Monthly estimate × 12'),
    visitTrend,
    growthPercentage,
    newVsReturning: estimated(
      { new: benchmarks.newVisitorPct, returning: 100 - benchmarks.newVisitorPct },
      'low',
      'Industry benchmark average'
    ),
    pagesPerVisit: estimated(
      benchmarks.pagesPerVisit,
      'low',
      'Industry benchmark average'
    ),
    avgSessionDuration: estimated(
      formatDuration(benchmarks.avgSessionSeconds),
      'low',
      'Industry benchmark average'
    ),
    bounceRate: estimated(benchmarks.bounceRate, 'low', 'Industry benchmark average'),
    topCountries: unavailable('Requires Cloudflare Radar paid tier or SimilarWeb'),
    deviceSplit: estimated(
      {
        desktop: benchmarks.desktop,
        mobile: benchmarks.mobile,
        tablet: benchmarks.tablet,
      },
      'low',
      'Industry benchmark average'
    ),
  };
}
