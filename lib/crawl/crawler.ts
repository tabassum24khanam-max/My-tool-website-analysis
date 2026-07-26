import type { CrawlResult, CrawlPage } from '@/lib/types';
import { getScreenshotDir } from '@/lib/db';
import path from 'path';
import * as cheerio from 'cheerio';

const KEY_PATHS = [
  '/pricing', '/plans', '/products', '/shop', '/store',
  '/about', '/about-us', '/contact', '/contact-us',
  '/blog', '/affiliates', '/partners', '/features',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function fetchPage(url: string): Promise<CrawlPage | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { url, html, statusCode: res.status, headers };
  } catch {
    return null;
  }
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const $ = cheerio.load(html);
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text().trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          results.push(...parsed);
        } else {
          results.push(parsed);
        }
      }
    } catch {}
  });
  return results;
}

function extractScripts(html: string): string[] {
  const $ = cheerio.load(html);
  const scripts: string[] = [];
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) scripts.push(src);
  });
  $('script:not([src])').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 50000) {
      scripts.push(text.slice(0, 2000));
    }
  });
  return scripts;
}

function extractSitemapUrls(sitemapXml: string): string[] {
  const urls: string[] = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(sitemapXml)) !== null) {
    urls.push(m[1]);
  }
  return urls.slice(0, 100);
}

export async function crawlWebsite(domain: string, url: string): Promise<CrawlResult> {
  let screenshotPath: string | null = null;
  let homepagePage: CrawlPage = { url, html: '', statusCode: 0, headers: {} };
  const pages: CrawlPage[] = [];

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const context = await browser.newContext({
        userAgent: USER_AGENT,
        viewport: { width: 1280, height: 720 },
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.waitForTimeout(2000);

      const html = await page.content();
      const headers: Record<string, string> = {};
      homepagePage = { url, html, statusCode: 200, headers };

      const ssDir = getScreenshotDir();
      screenshotPath = path.join(ssDir, `${domain}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      await page.close();
      await context.close();
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error(`Playwright crawl failed for ${domain}, falling back to fetch:`, err);
    const fallback = await fetchPage(url);
    if (fallback) homepagePage = fallback;
  }

  const pagePromises = KEY_PATHS.map(async (p) => {
    const pageUrl = `${url}${p}`;
    const result = await fetchPage(pageUrl);
    if (result && result.statusCode >= 200 && result.statusCode < 400) {
      pages.push(result);
    }
  });
  await Promise.all(pagePromises);

  let robotsTxt: string | null = null;
  try {
    const r = await fetch(`${url}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) robotsTxt = await r.text();
  } catch {}

  let sitemapUrls: string[] = [];
  try {
    const s = await fetch(`${url}/sitemap.xml`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (s.ok) {
      const xml = await s.text();
      sitemapUrls = extractSitemapUrls(xml);
    }
  } catch {}

  const allHtml = [homepagePage.html, ...pages.map((p) => p.html)].join('\n');
  const jsonLd = extractJsonLd(allHtml);
  const scripts = extractScripts(homepagePage.html);

  const cookies: string[] = [];
  const setCookieHeader = homepagePage.headers['set-cookie'];
  if (setCookieHeader) {
    cookies.push(...setCookieHeader.split(',').map((c) => c.trim()));
  }

  return {
    domain,
    url,
    homepage: homepagePage,
    pages,
    screenshotPath,
    robotsTxt,
    sitemapUrls,
    jsonLd,
    scripts,
    cookies,
    allHtml,
  };
}
