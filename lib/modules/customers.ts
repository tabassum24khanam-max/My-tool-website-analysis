import type { CustomersResult, CrawlResult } from '@/lib/types';
import { estimated, unavailable, metricValue } from '@/lib/types';

export async function analyzeCustomers(crawl: CrawlResult): Promise<CustomersResult> {
  const { analyzeTraffic } = await import('./traffic');
  const { analyzeProducts } = await import('./products');

  let monthlyVisits: number | null = null;
  let convRate = 2.1;
  let aov: number | null = null;

  try {
    const trafficResult = await analyzeTraffic(crawl);
    monthlyVisits = metricValue(trafficResult.estimatedMonthlyVisits);
  } catch {}

  try {
    const productsResult = await analyzeProducts(crawl);
    const cr = metricValue(productsResult.estimatedConversionRate);
    if (cr) convRate = cr;
    aov = metricValue(productsResult.estimatedAOV);
  } catch {}

  if (!monthlyVisits) {
    return {
      estimatedCustomers: unavailable('Requires traffic estimate (domain not ranked)'),
      returningRate: estimated(35, 'low', 'Cross-industry benchmark: ~35% returning customers'),
      purchaseFrequency: estimated('1.5x per year', 'low', 'Cross-industry benchmark average'),
      avgOrderValue: aov
        ? estimated(aov, 'low', 'Average of detected prices on site')
        : unavailable('No prices detected'),
      conversionRate: estimated(convRate, 'low', 'Cross-industry e-commerce benchmark (2.1%)'),
      cartAbandonment: estimated(70, 'low', 'Cross-industry benchmark: ~70% cart abandonment'),
      customerAcquisitionCost: unavailable('Requires ad spend and customer count estimates'),
    };
  }

  const monthlyCustomers = Math.round(monthlyVisits * (convRate / 100));
  const yearlyCustomers = monthlyCustomers * 12;

  return {
    estimatedCustomers: estimated(
      yearlyCustomers,
      'low',
      `${monthlyVisits.toLocaleString()} monthly visitors × ${convRate}% conversion rate × 12 months`
    ),
    returningRate: estimated(35, 'low', 'Cross-industry benchmark: ~35% returning customers'),
    purchaseFrequency: estimated('1.5x per year', 'low', 'Cross-industry benchmark average'),
    avgOrderValue: aov
      ? estimated(aov, 'low', 'Average of detected prices on site')
      : unavailable('No prices detected'),
    conversionRate: estimated(convRate, 'low', 'Cross-industry e-commerce benchmark (2.1%)'),
    cartAbandonment: estimated(70, 'low', 'Cross-industry benchmark: ~70% cart abandonment'),
    customerAcquisitionCost: unavailable('Requires ad spend estimate to calculate (ad spend / customers)'),
  };
}
