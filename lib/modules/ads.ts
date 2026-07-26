import type { AdsResult, CrawlResult } from '@/lib/types';
import { defaultAds } from './defaults';

export async function analyzeAds(_crawl: CrawlResult): Promise<AdsResult> {
  return { ...defaultAds };
}
