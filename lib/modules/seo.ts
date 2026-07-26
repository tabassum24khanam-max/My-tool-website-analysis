import type { SeoResult, CrawlResult } from '@/lib/types';
import { defaultSeo } from './defaults';

export async function analyzeSeo(_crawl: CrawlResult): Promise<SeoResult> {
  return { ...defaultSeo };
}
