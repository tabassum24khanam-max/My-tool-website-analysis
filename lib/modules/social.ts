import type { SocialResult, SocialAccount, CrawlResult } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';

interface PlatformPattern {
  platform: string;
  patterns: RegExp[];
  handleExtractor: (url: string) => string;
}

const PLATFORMS: PlatformPattern[] = [
  {
    platform: 'YouTube',
    patterns: [/youtube\.com\/(c\/|channel\/|@|user\/)?[\w-]+/i, /youtu\.be/i],
    handleExtractor: (url) => {
      const match = url.match(/youtube\.com\/(?:c\/|channel\/|@|user\/)([\w-]+)/i);
      return match ? match[1] : url.split('/').filter(Boolean).pop() || '';
    },
  },
  {
    platform: 'Instagram',
    patterns: [/instagram\.com\/[\w.]+/i],
    handleExtractor: (url) => {
      const match = url.match(/instagram\.com\/([\w.]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'Facebook',
    patterns: [/facebook\.com\/[\w.-]+/i, /fb\.com\/[\w.-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/(?:facebook|fb)\.com\/([\w.-]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'X (Twitter)',
    patterns: [/(?:twitter|x)\.com\/[\w]+/i],
    handleExtractor: (url) => {
      const match = url.match(/(?:twitter|x)\.com\/([\w]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'LinkedIn',
    patterns: [/linkedin\.com\/(?:company|in)\/[\w-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/linkedin\.com\/(?:company|in)\/([\w-]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'TikTok',
    patterns: [/tiktok\.com\/@[\w.-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/tiktok\.com\/@([\w.-]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'Pinterest',
    patterns: [/pinterest\.com\/[\w-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/pinterest\.com\/([\w-]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'Reddit',
    patterns: [/reddit\.com\/r\/[\w-]+/i, /reddit\.com\/user\/[\w-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/reddit\.com\/(?:r|user)\/([\w-]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'Threads',
    patterns: [/threads\.net\/@?[\w.]+/i],
    handleExtractor: (url) => {
      const match = url.match(/threads\.net\/@?([\w.]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'Discord',
    patterns: [/discord\.gg\/[\w-]+/i, /discord\.com\/invite\/[\w-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/(?:discord\.gg|discord\.com\/invite)\/([\w-]+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'GitHub',
    patterns: [/github\.com\/[\w-]+/i],
    handleExtractor: (url) => {
      const match = url.match(/github\.com\/([\w-]+)/i);
      return match ? match[1] : '';
    },
  },
];

const IGNORE_HANDLES = new Set([
  'share', 'intent', 'sharer', 'login', 'signup', 'help',
  'about', 'terms', 'privacy', 'policy', 'explore', 'search',
  'settings', 'home', 'discover', 'watch', 'feed', 'create',
]);

function extractSocialLinks(html: string, jsonLd: Record<string, unknown>[]): Map<string, string> {
  const found = new Map<string, string>();

  const sameAs = jsonLd.flatMap((j) => {
    const sa = j.sameAs;
    if (Array.isArray(sa)) return sa as string[];
    if (typeof sa === 'string') return [sa];
    return [];
  });

  for (const url of sameAs) {
    for (const platform of PLATFORMS) {
      if (platform.patterns.some((p) => p.test(url)) && !found.has(platform.platform)) {
        const handle = platform.handleExtractor(url);
        if (handle && !IGNORE_HANDLES.has(handle.toLowerCase())) {
          found.set(platform.platform, url);
        }
      }
    }
  }

  const urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  for (const url of urlMatches) {
    for (const platform of PLATFORMS) {
      if (platform.patterns.some((p) => p.test(url)) && !found.has(platform.platform)) {
        const handle = platform.handleExtractor(url);
        if (handle && !IGNORE_HANDLES.has(handle.toLowerCase())) {
          found.set(platform.platform, url);
        }
      }
    }
  }

  return found;
}

export async function analyzeSocial(crawl: CrawlResult): Promise<SocialResult> {
  const links = extractSocialLinks(crawl.allHtml, crawl.jsonLd);

  if (links.size === 0) {
    return {
      accounts: unavailable('No social media links found on the website'),
    };
  }

  const accounts: SocialAccount[] = [];

  for (const [platform, url] of Array.from(links.entries())) {
    const def = PLATFORMS.find((p) => p.platform === platform)!;
    const handle = def.handleExtractor(url);

    accounts.push({
      platform,
      url,
      handle,
      followers: unavailable('Requires platform API or authenticated access'),
      engagementRate: unavailable('Requires platform API'),
      postingFrequency: unavailable('Requires platform API'),
      avgLikes: unavailable('Requires platform API'),
      avgComments: unavailable('Requires platform API'),
      avgViews: unavailable('Requires platform API'),
    });
  }

  return {
    accounts: measured(accounts, 'Social links extracted from HTML and JSON-LD sameAs'),
  };
}
