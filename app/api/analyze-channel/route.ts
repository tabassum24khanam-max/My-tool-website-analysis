import { NextRequest, NextResponse } from 'next/server';
import { analyzeChannel } from '@/lib/channel-pipeline';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, refresh } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const report = await analyzeChannel(url, refresh === true);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Channel analysis failed';
    console.error('Channel analysis error:', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
