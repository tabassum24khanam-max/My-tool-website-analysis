import type { CustomersResult, CrawlResult } from '@/lib/types';
import { defaultCustomers } from './defaults';

export async function analyzeCustomers(_crawl: CrawlResult): Promise<CustomersResult> {
  return { ...defaultCustomers };
}
