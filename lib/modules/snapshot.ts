import type { SnapshotResult, CrawlResult } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';
import * as cheerio from 'cheerio';
import { fetchWithTimeout } from '@/lib/utils';

function findMeta($: cheerio.CheerioAPI, names: string[]): string | null {
  for (const name of names) {
    const content =
      $(`meta[property="${name}"]`).attr('content') ||
      $(`meta[name="${name}"]`).attr('content');
    if (content?.trim()) return content.trim();
  }
  return null;
}

function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return [];
  const filtered = matches.filter(
    (e) => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('example')
  );
  return [...new Set(filtered)].slice(0, 10);
}

function extractPhones(text: string): string[] {
  const matches = text.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g
  );
  if (!matches) return [];
  const filtered = matches.filter((p) => p.replace(/\D/g, '').length >= 7);
  return [...new Set(filtered)].slice(0, 5);
}

function detectIndustry(text: string): string | null {
  const lower = text.toLowerCase();
  const categories: Record<string, string[]> = {
    'E-commerce': ['shop', 'store', 'cart', 'checkout', 'buy now', 'add to cart', 'shipping'],
    'SaaS': ['saas', 'software', 'platform', 'dashboard', 'api', 'integrate', 'subscription'],
    'FinTech': ['payment', 'banking', 'finance', 'fintech', 'transaction', 'wallet', 'invest'],
    'Healthcare': ['health', 'medical', 'patient', 'clinical', 'healthcare', 'pharmacy'],
    'Education': ['learn', 'course', 'education', 'student', 'teach', 'academy', 'training'],
    'Media & Entertainment': ['news', 'media', 'video', 'stream', 'entertainment', 'podcast'],
    'Real Estate': ['property', 'real estate', 'rent', 'mortgage', 'listing', 'apartment'],
    'Travel': ['travel', 'hotel', 'flight', 'booking', 'tourism', 'vacation', 'destination'],
    'Food & Beverage': ['restaurant', 'food', 'recipe', 'delivery', 'menu', 'catering'],
    'Marketing': ['marketing', 'advertising', 'campaign', 'seo', 'analytics', 'brand'],
    'Technology': ['technology', 'tech', 'cloud', 'data', 'ai', 'machine learning', 'developer'],
    'Agency': ['agency', 'design', 'creative', 'studio', 'consulting', 'services'],
  };

  let bestCategory = '';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categories)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 2 ? bestCategory : null;
}

function detectBusinessModel(allText: string, _$pages: cheerio.CheerioAPI[]): string {
  const lower = allText.toLowerCase();

  if (lower.includes('add to cart') || lower.includes('shop now') || lower.includes('buy now')) {
    return 'E-commerce';
  }
  if (lower.includes('subscribe') && (lower.includes('/month') || lower.includes('/year') || lower.includes('pricing'))) {
    return 'SaaS / Subscription';
  }
  if (lower.includes('marketplace') || lower.includes('sell on') || lower.includes('vendor')) {
    return 'Marketplace';
  }
  if (lower.includes('book a call') || lower.includes('get a quote') || lower.includes('contact us for pricing')) {
    return 'Services / Consulting';
  }
  if (lower.includes('blog') && lower.includes('newsletter') && !lower.includes('pricing')) {
    return 'Content / Media';
  }
  return 'Unknown';
}

function extractPricing(pages: Array<{ html: string }>): {
  pricing: string;
  plans: string[];
  freeTrial: boolean;
} {
  let pricing = '';
  const plans: string[] = [];
  let freeTrial = false;

  for (const page of pages) {
    const lower = page.html.toLowerCase();
    if (lower.includes('free trial') || lower.includes('start free') || lower.includes('try for free')) {
      freeTrial = true;
    }

    const $ = cheerio.load(page.html);
    const priceMatches = page.html.match(/\$\d+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|year|yr))?/gi);
    if (priceMatches && priceMatches.length > 0) {
      pricing = priceMatches.slice(0, 5).join(', ');
    }

    $('[class*="plan"], [class*="pricing"], [class*="tier"]').each((_, el) => {
      const text = $(el).text().trim().slice(0, 100);
      if (text.length > 3 && text.length < 100) {
        plans.push(text.replace(/\s+/g, ' '));
      }
    });
  }

  return { pricing, plans: [...new Set(plans)].slice(0, 10), freeTrial };
}

function extractCountries(allHtml: string): string[] {
  const countries: string[] = [];
  const $ = cheerio.load(allHtml);

  $('link[hreflang]').each((_, el) => {
    const lang = $(el).attr('hreflang');
    if (lang && lang !== 'x-default') {
      const parts = lang.split('-');
      if (parts.length > 1) countries.push(parts[1].toUpperCase());
    }
  });

  const currencyMap: Record<string, string> = {
    '$': 'US', '€': 'EU', '£': 'UK', '¥': 'JP/CN', '₹': 'IN',
    'R$': 'BR', '₩': 'KR', 'A$': 'AU', 'C$': 'CA',
  };
  for (const [symbol, country] of Object.entries(currencyMap)) {
    if (allHtml.includes(symbol)) countries.push(country);
  }

  return [...new Set(countries)].slice(0, 10);
}

export async function analyzeSnapshot(crawl: CrawlResult): Promise<SnapshotResult> {
  const $ = cheerio.load(crawl.homepage.html);
  const allText = crawl.allHtml;

  const orgJsonLd = crawl.jsonLd.find(
    (j) => j['@type'] === 'Organization' || j['@type'] === 'WebSite'
  ) as Record<string, unknown> | undefined;

  const companyName =
    (orgJsonLd?.name as string) ||
    findMeta($, ['og:site_name', 'application-name']) ||
    $('title').text().split(/[|\-–—]/).map((s) => s.trim())[0] ||
    crawl.domain;

  const logoUrl =
    (orgJsonLd?.logo as string) ||
    findMeta($, ['og:image']) ||
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    `https://www.google.com/s2/favicons?domain=${crawl.domain}&sz=128`;

  const fullLogoUrl = logoUrl.startsWith('http')
    ? logoUrl
    : logoUrl.startsWith('//')
      ? `https:${logoUrl}`
      : `${crawl.url}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;

  const description =
    findMeta($, ['og:description', 'description', 'twitter:description']) || '';

  const industry = detectIndustry(allText);
  const businessModel = detectBusinessModel(allText, []);

  const productJsonLd = crawl.jsonLd
    .filter((j) => j['@type'] === 'Product')
    .map((j) => (j as Record<string, unknown>).name as string)
    .filter(Boolean);

  const productNames =
    productJsonLd.length > 0
      ? productJsonLd
      : $('h2, h3')
          .toArray()
          .map((el) => $(el).text().trim())
          .filter((t) => t.length > 3 && t.length < 80)
          .slice(0, 10);

  const pricingData = extractPricing([crawl.homepage, ...crawl.pages]);
  const emails = extractEmails(allText);
  const phones = extractPhones(allText);
  const countries = extractCountries(crawl.allHtml);

  let yearFounded: string | null = null;
  const aboutText = crawl.pages.find((p) => p.url.includes('about'))?.html || '';
  const yearMatch =
    aboutText.match(/(?:founded|established|since|started)\s*(?:in\s+)?(\d{4})/i) ||
    allText.match(/(?:founded|established|since)\s*(?:in\s+)?(\d{4})/i);
  if (yearMatch) yearFounded = yearMatch[1];

  if (!yearFounded) {
    try {
      const rdap = await fetchWithTimeout(
        `https://rdap.org/domain/${crawl.domain}`,
        { timeoutMs: 5000 }
      );
      if (rdap.ok) {
        const data = await rdap.json();
        if (data.events) {
          const reg = (data.events as Array<{ eventAction: string; eventDate: string }>).find(
            (e) => e.eventAction === 'registration'
          );
          if (reg) yearFounded = reg.eventDate.slice(0, 4);
        }
      }
    } catch {}
  }

  const founder =
    (orgJsonLd?.founder as string) ||
    (() => {
      const match = aboutText.match(
        /(?:founded|co-founded|created)\s+by\s+([A-Z][a-z]+ [A-Z][a-z]+)/i
      );
      return match ? match[1] : null;
    })();

  return {
    companyName: measured(companyName, orgJsonLd ? 'JSON-LD Organization' : 'Page title / meta'),
    logoUrl: measured(fullLogoUrl, orgJsonLd?.logo ? 'JSON-LD' : 'Meta / favicon'),
    screenshotPath: crawl.screenshotPath
      ? measured(crawl.screenshotPath, 'Playwright screenshot')
      : unavailable('Screenshot capture failed'),
    description: description
      ? measured(description, 'Meta description')
      : unavailable('No meta description found'),
    industry: industry
      ? estimated(industry, 'medium', 'Keyword classification over page text')
      : unavailable('Could not determine industry from page content'),
    businessModel: businessModel !== 'Unknown'
      ? estimated(businessModel, 'medium', 'Signal detection: checkout, pricing, subscription patterns')
      : unavailable('Could not determine business model'),
    products: productNames.length > 0
      ? measured(productNames, productJsonLd.length > 0 ? 'JSON-LD Product' : 'Heading extraction')
      : unavailable('No products detected on crawled pages'),
    pricing: pricingData.pricing
      ? measured(pricingData.pricing, 'Price pattern extraction from pricing pages')
      : unavailable('No public pricing found'),
    subscriptionPlans: pricingData.plans.length > 0
      ? measured(pricingData.plans, 'Pricing page plan cards')
      : unavailable('No subscription plans detected'),
    freeTrial: measured(pricingData.freeTrial, 'Text signal detection'),
    countriesServed: countries.length > 0
      ? estimated(countries, 'low', 'Hreflang tags and currency symbols')
      : unavailable('Could not determine countries served'),
    contactEmails: emails.length > 0
      ? measured(emails, 'Email pattern extraction from page HTML')
      : unavailable('No email addresses found'),
    contactPhones: phones.length > 0
      ? measured(phones, 'Phone pattern extraction from page HTML')
      : unavailable('No phone numbers found'),
    headquarters: orgJsonLd?.address
      ? measured(String(orgJsonLd.address), 'JSON-LD Organization address')
      : unavailable('Headquarters not found in page data'),
    yearFounded: yearFounded
      ? measured(yearFounded, yearMatch ? 'About page text' : 'RDAP domain registration')
      : unavailable('Year founded not found'),
    founder: founder
      ? measured(founder, 'JSON-LD or about page text')
      : unavailable('Founder not found in page data'),
    employeeEstimate: unavailable('Requires paid data source (LinkedIn/Crunchbase)'),
  };
}
