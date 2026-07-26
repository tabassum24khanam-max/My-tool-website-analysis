import type { ProductsResult, CrawlResult } from '@/lib/types';
import { measured, estimated, unavailable } from '@/lib/types';
import * as cheerio from 'cheerio';

function detectCustomerType(text: string): string {
  const lower = text.toLowerCase();
  const b2bSignals = ['enterprise', 'business', 'team', 'organization', 'company', 'corporate', 'b2b', 'per seat', 'per user'];
  const b2cSignals = ['personal', 'individual', 'family', 'consumer', 'b2c', 'per month', 'get started'];

  const b2bScore = b2bSignals.filter((s) => lower.includes(s)).length;
  const b2cScore = b2cSignals.filter((s) => lower.includes(s)).length;

  if (b2bScore > b2cScore + 1) return 'B2B';
  if (b2cScore > b2bScore + 1) return 'B2C';
  if (b2bScore > 0 && b2cScore > 0) return 'B2B + B2C';
  return 'Unknown';
}

function detectPricingStrategy(prices: number[], hasSubscription: boolean): string {
  if (prices.length === 0) return 'Unknown';
  if (hasSubscription) {
    if (prices.length >= 3) return 'Tiered subscription';
    return 'Subscription';
  }
  if (prices.length >= 5) {
    const sorted = [...prices].sort((a, b) => a - b);
    const range = sorted[sorted.length - 1] - sorted[0];
    if (range > sorted[0] * 5) return 'Wide price range';
    return 'Product catalog';
  }
  return 'Standard pricing';
}

function extractProducts(crawl: CrawlResult): Array<{ name: string; price?: string; category?: string }> {
  const products: Array<{ name: string; price?: string; category?: string }> = [];
  const seen = new Set<string>();

  for (const jsonLd of crawl.jsonLd) {
    if (jsonLd['@type'] === 'Product') {
      const name = jsonLd.name as string;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        const offers = jsonLd.offers as Record<string, unknown> | undefined;
        const price = offers?.price ? `$${offers.price}` : undefined;
        const category = (jsonLd.category as string) || undefined;
        products.push({ name, price, category });
      }
    }
  }

  for (const page of [crawl.homepage, ...crawl.pages]) {
    if (!page.url.includes('product') && !page.url.includes('shop') && !page.url.includes('pricing')) continue;
    const $ = cheerio.load(page.html);
    $('[class*="product"], [class*="item"], [class*="plan"]').each((_, el) => {
      const name = $(el).find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
      const priceEl = $(el).find('[class*="price"]').first().text().trim();
      if (name && name.length > 2 && name.length < 100 && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        products.push({ name, price: priceEl || undefined });
      }
    });
  }

  return products.slice(0, 20);
}

function extractPrices(html: string): number[] {
  const matches = html.match(/\$(\d+(?:\.\d{2})?)/g);
  if (!matches) return [];
  return matches
    .map((m) => parseFloat(m.replace('$', '')))
    .filter((n) => n > 0 && n < 100000);
}

export async function analyzeProducts(crawl: CrawlResult): Promise<ProductsResult> {
  const allText = crawl.allHtml;
  const lower = allText.toLowerCase();

  const products = extractProducts(crawl);
  const prices = extractPrices(allText);

  const hasSubscription = lower.includes('/month') || lower.includes('/year') ||
    lower.includes('subscribe') || lower.includes('subscription') || lower.includes('recurring');
  const hasFreeTrial = lower.includes('free trial') || lower.includes('try free') ||
    lower.includes('start free') || lower.includes('free plan');

  const customerType = detectCustomerType(allText);
  const pricingStrategy = detectPricingStrategy(prices, hasSubscription);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const aov = prices.length > 0
    ? prices.reduce((a, b) => a + b, 0) / prices.length
    : null;

  let targetAudience = 'General';
  if (customerType === 'B2B') targetAudience = 'Businesses and organizations';
  else if (customerType === 'B2C') targetAudience = 'Individual consumers';
  else if (customerType === 'B2B + B2C') targetAudience = 'Both businesses and consumers';

  const BENCHMARK_CONVERSION_RATE = 2.1;

  return {
    products: products.length > 0
      ? measured(products, 'JSON-LD Product schema and page element extraction')
      : unavailable('No products detected on crawled pages'),
    categories: categories.length > 0
      ? measured(categories, 'Product categories from JSON-LD')
      : unavailable('No product categories found'),
    pricingStrategy: pricingStrategy !== 'Unknown'
      ? estimated(pricingStrategy, 'medium', 'Analysis of detected price patterns and subscription signals')
      : unavailable('Not enough pricing data to determine strategy'),
    hasSubscription: measured(hasSubscription, 'Text pattern detection (subscription/recurring/per month)'),
    hasFreeTrial: measured(hasFreeTrial, 'Text pattern detection (free trial/try free/start free)'),
    targetAudience: estimated(targetAudience, 'medium', 'B2B vs B2C signal classification'),
    customerType: customerType !== 'Unknown'
      ? estimated(customerType, 'medium', 'Enterprise/business vs personal/consumer keyword analysis')
      : unavailable('Could not determine customer type'),
    estimatedAOV: aov
      ? estimated(
          Math.round(aov * 100) / 100,
          prices.length >= 5 ? 'medium' : 'low',
          `Average of ${prices.length} detected prices on the site`
        )
      : unavailable('No prices detected to estimate AOV'),
    estimatedMonthlySales: unavailable('Requires traffic estimate + conversion rate to calculate'),
    estimatedYearlyRevenue: unavailable('Requires traffic estimate + conversion rate to calculate'),
    estimatedConversionRate: estimated(
      BENCHMARK_CONVERSION_RATE,
      'low',
      'Cross-industry e-commerce benchmark average (2.1%)'
    ),
  };
}
