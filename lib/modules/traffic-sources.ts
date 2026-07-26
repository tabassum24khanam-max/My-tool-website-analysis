import type { TrafficSourcesResult, CrawlResult } from '@/lib/types';
import { defaultTrafficSources } from './defaults';

export async function analyzeTrafficSources(_crawl: CrawlResult): Promise<TrafficSourcesResult> {
  return { ...defaultTrafficSources };
}
