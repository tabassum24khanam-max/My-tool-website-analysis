import type { AdsResult, CrawlResult } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/utils';

interface PixelDetection {
  name: string;
  platform: string;
  patterns: RegExp[];
}

const PIXEL_PATTERNS: PixelDetection[] = [
  { name: 'Facebook Pixel', platform: 'facebook', patterns: [/fbevents\.js/i, /connect\.facebook\.net/i, /fbq\(/i] },
  { name: 'Google Ads', platform: 'google', patterns: [/googleads\.g\.doubleclick/i, /pagead2\.googlesyndication/i, /adservice\.google/i, /google_tag_params/i] },
  { name: 'Google Ads Conversion', platform: 'google', patterns: [/googleadservices\.com\/pagead\/conversion/i] },
  { name: 'TikTok Pixel', platform: 'tiktok', patterns: [/analytics\.tiktok\.com/i] },
  { name: 'LinkedIn Insight', platform: 'linkedin', patterns: [/snap\.licdn\.com/i, /linkedin\.com\/insight/i] },
  { name: 'Twitter/X Pixel', platform: 'twitter', patterns: [/static\.ads-twitter\.com/i, /analytics\.twitter\.com/i] },
  { name: 'Pinterest Tag', platform: 'pinterest', patterns: [/pintrk/i, /s\.pinimg\.com\/ct/i] },
  { name: 'Snapchat Pixel', platform: 'snapchat', patterns: [/sc-static\.net\/scevent/i] },
  { name: 'Microsoft/Bing Ads', platform: 'microsoft', patterns: [/bat\.bing\.com/i, /clarity\.ms/i] },
];

async function fetchMetaAdLibrary(domain: string): Promise<Array<{ body: string; startDate: string; endDate?: string; platforms: string[] }>> {
  const token = process.env.FB_AD_LIBRARY_TOKEN;
  if (!token) return [];

  try {
    const res = await fetchWithTimeout(
      `https://graph.facebook.com/v19.0/ads_archive?search_terms=${encodeURIComponent(domain)}&ad_reached_countries=['US']&fields=ad_creative_bodies,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms&access_token=${token}&limit=10`,
      { timeoutMs: 10000 }
    );
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.data) return [];

    return data.data.map((ad: Record<string, unknown>) => ({
      body: (ad.ad_creative_bodies as string[])?.[0] || '',
      startDate: (ad.ad_delivery_start_time as string) || '',
      endDate: (ad.ad_delivery_stop_time as string) || undefined,
      platforms: (ad.publisher_platforms as string[]) || [],
    })).filter((ad: { body: string }) => ad.body);
  } catch {
    return [];
  }
}

export async function analyzeAds(crawl: CrawlResult): Promise<AdsResult> {
  const allContent = crawl.scripts.join(' ') + ' ' + crawl.homepage.html;

  const detectedPixels: string[] = [];
  const platformFlags: Record<string, boolean> = {};

  for (const pixel of PIXEL_PATTERNS) {
    if (pixel.patterns.some((p) => p.test(allContent))) {
      detectedPixels.push(pixel.name);
      platformFlags[pixel.platform] = true;
    }
  }

  const metaAds = await fetchMetaAdLibrary(crawl.domain);

  const hasGoogleAds = !!platformFlags['google'];
  const hasFacebookAds = !!platformFlags['facebook'] || metaAds.length > 0;
  const hasTiktokAds = !!platformFlags['tiktok'];
  const hasLinkedinAds = !!platformFlags['linkedin'];
  const hasPinterestAds = !!platformFlags['pinterest'];
  const hasTwitterAds = !!platformFlags['twitter'];

  const adsDetected = hasGoogleAds || hasFacebookAds || hasTiktokAds ||
    hasLinkedinAds || hasPinterestAds || hasTwitterAds;

  return {
    detectedPixels: detectedPixels.length > 0
      ? measured(detectedPixels, 'Script and HTML pattern matching for tracking pixels')
      : unavailable('No advertising pixels detected'),
    googleAds: measured(hasGoogleAds, 'Google Ads/DoubleClick/AdSense script detection'),
    facebookAds: measured(hasFacebookAds, metaAds.length > 0 ? 'Facebook Pixel + Meta Ad Library' : 'Facebook Pixel detection'),
    tiktokAds: measured(hasTiktokAds, 'TikTok analytics pixel detection'),
    linkedinAds: measured(hasLinkedinAds, 'LinkedIn Insight tag detection'),
    pinterestAds: measured(hasPinterestAds, 'Pinterest conversion tag detection'),
    twitterAds: measured(hasTwitterAds, 'Twitter/X pixel detection'),
    metaAdLibrary: metaAds.length > 0
      ? measured(metaAds, 'Meta Ad Library API')
      : unavailable(
          process.env.FB_AD_LIBRARY_TOKEN
            ? 'No ads found in Meta Ad Library for this domain'
            : 'No FB_AD_LIBRARY_TOKEN configured'
        ),
    estimatedAdSpend: adsDetected
      ? estimated(
          0,
          'low',
          'Ad spend estimation requires traffic data + benchmark CPC — calculated in post-processing'
        )
      : unavailable('No advertising detected'),
  };
}
