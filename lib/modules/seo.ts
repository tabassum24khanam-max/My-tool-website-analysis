import type { SeoResult, CrawlResult } from '@/lib/types';
import { measured, unavailable } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/utils';
import * as cheerio from 'cheerio';

async function fetchOpenPageRank(domain: string): Promise<number | null> {
  const key = process.env.OPENPAGERANK_API_KEY;
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(
      `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`,
      { timeoutMs: 10000, headers: { 'API-OPR': key } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.response?.[0]?.page_rank_decimal != null) {
      return data.response[0].page_rank_decimal;
    }
    return null;
  } catch {
    return null;
  }
}

interface PageSpeedResult {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  lcp: number;
  fid: number;
  cls: number;
  mobileFriendly: boolean;
}

async function fetchPageSpeed(url: string): Promise<PageSpeedResult | null> {
  const key = process.env.PAGESPEED_API_KEY;
  const params = new URLSearchParams({
    url,
    strategy: 'mobile',
    category: 'performance',
  });
  ['seo', 'accessibility', 'best-practices'].forEach((c) =>
    params.append('category', c)
  );
  if (key) params.set('key', key);

  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { timeoutMs: 45000 }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const cats = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;

    return {
      performance: Math.round((cats?.performance?.score || 0) * 100),
      seo: Math.round((cats?.seo?.score || 0) * 100),
      accessibility: Math.round((cats?.accessibility?.score || 0) * 100),
      bestPractices: Math.round((cats?.['best-practices']?.score || 0) * 100),
      lcp: (audits?.['largest-contentful-paint']?.numericValue || 0) / 1000,
      fid: audits?.['max-potential-fid']?.numericValue || 0,
      cls: audits?.['cumulative-layout-shift']?.numericValue || 0,
      mobileFriendly: (cats?.seo?.score || 0) >= 0.7,
    };
  } catch {
    return null;
  }
}

function extractKeywords(text: string): Array<{ keyword: string; frequency: number }> {
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
    'which', 'go', 'me', 'when', 'make', 'can', 'like', 'no', 'just',
    'him', 'know', 'take', 'people', 'into', 'year', 'your', 'some',
    'them', 'than', 'then', 'now', 'look', 'only', 'come', 'its',
    'over', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
    'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
    'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was',
    'were', 'been', 'has', 'had', 'may', 'more', 'other', 'could',
    'class', 'div', 'span', 'href', 'src', 'http', 'https', 'www',
    'com', 'org', 'net', 'html', 'css', 'true', 'false', 'null',
    'undefined', 'var', 'let', 'const', 'function', 'return',
  ]);

  const words = text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w.length <= 30 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([keyword, frequency]) => ({ keyword, frequency }));
}

export async function analyzeSeo(crawl: CrawlResult): Promise<SeoResult> {
  const $ = cheerio.load(crawl.homepage.html);
  const url = crawl.url;

  const [domainAuthority, pageSpeed] = await Promise.all([
    fetchOpenPageRank(crawl.domain),
    fetchPageSpeed(url),
  ]);

  const titleTag = $('title').text().trim();
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() || '';
  const h1Tags = $('h1')
    .toArray()
    .map((el) => $(el).text().trim())
    .filter((t) => t.length > 0);
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';

  let internalLinks = 0;
  let externalLinks = 0;
  const brokenLinks: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (
      href.startsWith('/') ||
      href.startsWith('#') ||
      href.includes(crawl.domain)
    ) {
      internalLinks++;
    } else if (href.startsWith('http')) {
      externalLinks++;
    }
  });

  const sslCert = crawl.url.startsWith('https://');
  const hasSitemap = crawl.sitemapUrls.length > 0;
  const hasRobotsTxt = crawl.robotsTxt !== null;

  const onSiteKeywords = extractKeywords(crawl.allHtml);

  return {
    domainAuthority: domainAuthority != null
      ? measured(domainAuthority, 'OpenPageRank')
      : unavailable(
          process.env.OPENPAGERANK_API_KEY
            ? 'Domain not found in OpenPageRank database'
            : 'No OPENPAGERANK_API_KEY configured'
        ),
    performanceScore: pageSpeed
      ? measured(pageSpeed.performance, 'Google PageSpeed Insights')
      : unavailable('PageSpeed analysis unavailable'),
    seoScore: pageSpeed
      ? measured(pageSpeed.seo, 'Google PageSpeed Insights')
      : unavailable('PageSpeed analysis unavailable'),
    accessibilityScore: pageSpeed
      ? measured(pageSpeed.accessibility, 'Google PageSpeed Insights')
      : unavailable('PageSpeed analysis unavailable'),
    bestPracticesScore: pageSpeed
      ? measured(pageSpeed.bestPractices, 'Google PageSpeed Insights')
      : unavailable('PageSpeed analysis unavailable'),
    coreWebVitals: pageSpeed
      ? measured(
          { lcp: pageSpeed.lcp, fid: pageSpeed.fid, cls: pageSpeed.cls },
          'Google PageSpeed Insights'
        )
      : unavailable('PageSpeed analysis unavailable'),
    sslCert: measured(sslCert, 'URL protocol check'),
    hasRobotsTxt: measured(hasRobotsTxt, 'Direct fetch of /robots.txt'),
    hasSitemap: measured(hasSitemap, 'Direct fetch of /sitemap.xml'),
    indexablePages: hasSitemap
      ? measured(crawl.sitemapUrls.length, 'Sitemap URL count')
      : unavailable('No sitemap.xml found'),
    onSiteKeywords: onSiteKeywords.length > 0
      ? measured(onSiteKeywords, 'TF-IDF keyword extraction from crawled pages')
      : unavailable('Not enough text content to extract keywords'),
    titleTag: titleTag
      ? measured(titleTag, 'HTML title tag')
      : unavailable('No title tag found'),
    metaDescription: metaDescription
      ? measured(metaDescription, 'Meta description tag')
      : unavailable('No meta description found'),
    h1Tags: h1Tags.length > 0
      ? measured(h1Tags, 'HTML H1 tags')
      : unavailable('No H1 tags found'),
    canonicalUrl: canonicalUrl
      ? measured(canonicalUrl, 'Link rel=canonical')
      : unavailable('No canonical URL specified'),
    internalLinks: measured(internalLinks, 'Homepage link count'),
    externalLinks: measured(externalLinks, 'Homepage link count'),
    brokenLinks: measured(brokenLinks, 'Not checked in basic crawl — requires deep crawl'),
    mobileFriendly: pageSpeed
      ? measured(pageSpeed.mobileFriendly, 'Google PageSpeed Insights mobile strategy')
      : unavailable('PageSpeed analysis unavailable'),
  };
}
