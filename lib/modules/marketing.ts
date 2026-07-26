import type { MarketingResult, CrawlResult } from '@/lib/types';
import { defaultMarketing } from './defaults';

export async function analyzeMarketing(_crawl: CrawlResult): Promise<MarketingResult> {
  return { ...defaultMarketing };
}
