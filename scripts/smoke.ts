import { reportSchema } from '../lib/schemas';

const TARGET = process.argv[2] || 'stripe.com';

async function smoke() {
  console.log(`Smoke test: analyzing ${TARGET}...`);

  const { analyzeWebsite } = await import('../lib/pipeline');

  const report = await analyzeWebsite(TARGET, true);

  console.log(`Domain: ${report.domain}`);
  console.log(`Analyzed at: ${report.analyzedAt}`);
  console.log(`Sections: ${Object.keys(report).filter((k) => k !== 'domain' && k !== 'url' && k !== 'analyzedAt' && k !== 'meta').length}`);

  const result = reportSchema.safeParse(report);
  if (!result.success) {
    console.error('Schema validation FAILED:');
    for (const issue of result.error.issues.slice(0, 10)) {
      console.error(`  ${issue.path.join('.')} — ${issue.message}`);
    }
    process.exit(1);
  }

  console.log('Schema validation: PASSED');

  const sections = [
    'snapshot', 'traffic', 'trafficSources', 'products', 'marketing',
    'ads', 'social', 'video', 'seo', 'competitors', 'tech', 'customers', 'aiAnalysis',
  ] as const;

  let totalMetrics = 0;
  let measured = 0;
  let estimated = 0;
  let unavailableCount = 0;

  for (const section of sections) {
    const sectionData = report[section];
    if (!sectionData || typeof sectionData !== 'object') continue;
    for (const val of Object.values(sectionData)) {
      if (val && typeof val === 'object' && 'status' in val) {
        totalMetrics++;
        const m = val as { status: string };
        if (m.status === 'measured') measured++;
        else if (m.status === 'estimated') estimated++;
        else unavailableCount++;
      }
    }
  }

  console.log(`\nMetric breakdown:`);
  console.log(`  Total: ${totalMetrics}`);
  console.log(`  Measured: ${measured}`);
  console.log(`  Estimated: ${estimated}`);
  console.log(`  Unavailable: ${unavailableCount}`);

  if (totalMetrics === 0) {
    console.error('FAIL: No metrics found');
    process.exit(1);
  }

  const meta = report.meta;
  if (meta) {
    console.log(`\nModule timings:`);
    for (const [name, m] of Object.entries(meta)) {
      const dur = (m as { durationMs: number; error?: string }).durationMs;
      const err = (m as { durationMs: number; error?: string }).error;
      console.log(`  ${name}: ${dur}ms${err ? ` (ERROR: ${err})` : ''}`);
    }
  }

  console.log('\nSmoke test PASSED');
}

smoke().catch((err) => {
  console.error('Smoke test FAILED:', err);
  process.exit(1);
});
