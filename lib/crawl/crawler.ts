import type { CrawlResult } from '@/lib/types';

export async function crawlWebsite(domain: string, url: string): Promise<CrawlResult> {
  return {
    domain,
    url,
    homepage: {
      url,
      html: '',
      statusCode: 0,
      headers: {},
    },
    pages: [],
    screenshotPath: null,
    robotsTxt: null,
    sitemapUrls: [],
    jsonLd: [],
    scripts: [],
    cookies: [],
    allHtml: '',
  };
}
