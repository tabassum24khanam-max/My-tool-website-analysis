import type { ProductsResult, CrawlResult } from '@/lib/types';
import { defaultProducts } from './defaults';

export async function analyzeProducts(_crawl: CrawlResult): Promise<ProductsResult> {
  return { ...defaultProducts };
}
