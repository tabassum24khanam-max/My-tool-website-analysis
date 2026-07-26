import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const domain = params.domain;
    const format = req.nextUrl.searchParams.get('format') || 'json';

    const reportJson = getCachedReport(domain);
    if (!reportJson) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (format === 'csv') {
      const report = JSON.parse(reportJson);
      const rows: string[] = ['Section,Metric,Value,Status,Source/Method'];

      function addMetric(section: string, label: string, metric: Record<string, unknown>) {
        if (metric.status === 'unavailable') {
          rows.push(`"${section}","${label}","","unavailable","${metric.reason}"`);
        } else {
          const val = typeof metric.value === 'object'
            ? JSON.stringify(metric.value)
            : String(metric.value);
          const detail = metric.status === 'measured' ? metric.source : metric.method;
          rows.push(`"${section}","${label}","${val.replace(/"/g, '""')}","${metric.status}","${String(detail || '').replace(/"/g, '""')}"`);
        }
      }

      for (const [sectionKey, section] of Object.entries(report)) {
        if (sectionKey === 'domain' || sectionKey === 'url' || sectionKey === 'analyzedAt' || sectionKey === 'meta') continue;
        if (typeof section !== 'object' || section === null) continue;
        for (const [metricKey, metric] of Object.entries(section as Record<string, unknown>)) {
          if (typeof metric === 'object' && metric !== null && 'status' in metric) {
            addMetric(sectionKey, metricKey, metric as Record<string, unknown>);
          }
        }
      }

      return new NextResponse(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${domain}-report.csv"`,
        },
      });
    }

    return new NextResponse(reportJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${domain}-report.json"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
