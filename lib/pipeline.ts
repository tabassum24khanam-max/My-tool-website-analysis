import type { Report, CrawlResult } from '@/lib/types';
import { crawlWebsite } from '@/lib/crawl/crawler';
import { runModule } from '@/lib/modules/run-module';
import { analyzeSnapshot } from '@/lib/modules/snapshot';
import { analyzeTraffic } from '@/lib/modules/traffic';
import { analyzeTrafficSources } from '@/lib/modules/traffic-sources';
import { analyzeProducts } from '@/lib/modules/products';
import { analyzeMarketing } from '@/lib/modules/marketing';
import { analyzeAds } from '@/lib/modules/ads';
import { analyzeSocial } from '@/lib/modules/social';
import { analyzeVideo } from '@/lib/modules/video';
import { analyzeSeo } from '@/lib/modules/seo';
import { analyzeCompetitors } from '@/lib/modules/competitors';
import { analyzeTech } from '@/lib/modules/tech';
import { analyzeCustomers } from '@/lib/modules/customers';
import { analyzeAi } from '@/lib/modules/ai-analysis';
import {
  defaultSnapshot,
  defaultTraffic,
  defaultTrafficSources,
  defaultProducts,
  defaultMarketing,
  defaultAds,
  defaultSocial,
  defaultVideo,
  defaultSeo,
  defaultCompetitors,
  defaultTech,
  defaultCustomers,
  defaultAiAnalysis,
} from '@/lib/modules/defaults';
import {
  getCachedReport,
  storeReport,
  addSearchHistory,
} from '@/lib/db';
import { normalizeDomain, normalizeUrl } from '@/lib/utils';
import { estimated, metricValue } from '@/lib/types';

const MODULE_TIMEOUT = 20_000;
const CRAWL_TIMEOUT = 45_000;

export async function analyzeWebsite(
  inputUrl: string,
  refresh = false
): Promise<Report> {
  const domain = normalizeDomain(inputUrl);
  const url = normalizeUrl(inputUrl);

  addSearchHistory(domain);

  if (!refresh) {
    const cached = getCachedReport(domain);
    if (cached) {
      return JSON.parse(cached) as Report;
    }
  }

  const crawlModule = await runModule<CrawlResult>(
    'crawl',
    CRAWL_TIMEOUT,
    () => crawlWebsite(domain, url),
    {
      domain,
      url,
      homepage: { url, html: '', statusCode: 0, headers: {} },
      pages: [],
      screenshotPath: null,
      robotsTxt: null,
      sitemapUrls: [],
      jsonLd: [],
      scripts: [],
      cookies: [],
      allHtml: '',
    }
  );

  const crawl = crawlModule.result;

  const [
    snapshotM,
    trafficM,
    trafficSourcesM,
    productsM,
    marketingM,
    adsM,
    socialM,
    videoM,
    seoM,
    competitorsM,
    techM,
    customersM,
  ] = await Promise.all([
    runModule('snapshot', MODULE_TIMEOUT, () => analyzeSnapshot(crawl), defaultSnapshot),
    runModule('traffic', MODULE_TIMEOUT, () => analyzeTraffic(crawl), defaultTraffic),
    runModule('trafficSources', MODULE_TIMEOUT, () => analyzeTrafficSources(crawl), defaultTrafficSources),
    runModule('products', MODULE_TIMEOUT, () => analyzeProducts(crawl), defaultProducts),
    runModule('marketing', MODULE_TIMEOUT, () => analyzeMarketing(crawl), defaultMarketing),
    runModule('ads', MODULE_TIMEOUT, () => analyzeAds(crawl), defaultAds),
    runModule('social', MODULE_TIMEOUT, () => analyzeSocial(crawl), defaultSocial),
    runModule('video', MODULE_TIMEOUT, () => analyzeVideo(crawl), defaultVideo),
    runModule('seo', MODULE_TIMEOUT, () => analyzeSeo(crawl), defaultSeo),
    runModule('competitors', MODULE_TIMEOUT, () => analyzeCompetitors(crawl), defaultCompetitors),
    runModule('tech', MODULE_TIMEOUT, () => analyzeTech(crawl), defaultTech),
    runModule('customers', MODULE_TIMEOUT, () => analyzeCustomers(crawl), defaultCustomers),
  ]);

  const partialReport = {
    domain,
    url,
    analyzedAt: new Date().toISOString(),
    snapshot: snapshotM.result,
    traffic: trafficM.result,
    trafficSources: trafficSourcesM.result,
    products: productsM.result,
    marketing: marketingM.result,
    ads: adsM.result,
    social: socialM.result,
    video: videoM.result,
    seo: seoM.result,
    competitors: competitorsM.result,
    tech: techM.result,
    customers: customersM.result,
  };

  const monthlyVisits = metricValue(trafficM.result.estimatedMonthlyVisits);
  const convRate = metricValue(productsM.result.estimatedConversionRate);
  const aov = metricValue(productsM.result.estimatedAOV);

  if (monthlyVisits && convRate) {
    const monthlySales = Math.round(monthlyVisits * (convRate / 100));
    productsM.result.estimatedMonthlySales = estimated(
      monthlySales,
      'low',
      `${monthlyVisits.toLocaleString()} visitors × ${convRate}% conversion`
    );
    if (aov) {
      productsM.result.estimatedYearlyRevenue = estimated(
        Math.round(monthlySales * aov * 12),
        'low',
        `${monthlySales.toLocaleString()} monthly sales × $${aov} AOV × 12 months`
      );
    }
  }

  const aiM = await runModule('aiAnalysis', 30_000, () => analyzeAi(partialReport), defaultAiAnalysis);

  const report: Report = {
    domain,
    url,
    analyzedAt: new Date().toISOString(),
    snapshot: snapshotM.result,
    traffic: trafficM.result,
    trafficSources: trafficSourcesM.result,
    products: productsM.result,
    marketing: marketingM.result,
    ads: adsM.result,
    social: socialM.result,
    video: videoM.result,
    seo: seoM.result,
    competitors: competitorsM.result,
    tech: techM.result,
    customers: customersM.result,
    aiAnalysis: aiM.result,
    meta: {
      crawl: crawlModule.meta,
      snapshot: snapshotM.meta,
      traffic: trafficM.meta,
      trafficSources: trafficSourcesM.meta,
      products: productsM.meta,
      marketing: marketingM.meta,
      ads: adsM.meta,
      social: socialM.meta,
      video: videoM.meta,
      seo: seoM.meta,
      competitors: competitorsM.meta,
      tech: techM.meta,
      customers: customersM.meta,
      aiAnalysis: aiM.meta,
    },
  };

  storeReport(domain, JSON.stringify(report));

  return report;
}
