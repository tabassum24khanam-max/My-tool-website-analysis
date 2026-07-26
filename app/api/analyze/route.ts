import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsite } from '@/lib/pipeline';

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url as string;
    const refresh = body.refresh === true;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "url" field' },
        { status: 400 }
      );
    }

    const report = await analyzeWebsite(url, refresh);
    return NextResponse.json(report);
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
