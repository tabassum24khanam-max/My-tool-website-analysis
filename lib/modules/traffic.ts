import type { TrafficResult, CrawlResult } from '@/lib/types';
import { defaultTraffic } from './defaults';

export async function analyzeTraffic(_crawl: CrawlResult): Promise<TrafficResult> {
  return { ...defaultTraffic };
}
