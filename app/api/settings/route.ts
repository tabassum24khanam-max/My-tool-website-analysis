import { NextRequest, NextResponse } from 'next/server';
import { getAiMode, setAiMode } from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json({ aiMode: getAiMode() });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ aiMode: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (typeof body.aiMode === 'boolean') {
      setAiMode(body.aiMode);
    }
    return NextResponse.json({ aiMode: getAiMode() });
  } catch (err) {
    console.error('Settings POST error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
