import type { TechResult, CrawlResult } from '@/lib/types';
import { defaultTech } from './defaults';

export async function analyzeTech(_crawl: CrawlResult): Promise<TechResult> {
  return { ...defaultTech };
}
