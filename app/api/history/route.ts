import { NextResponse } from 'next/server';
import { getSearchHistory } from '@/lib/db';

export async function GET() {
  try {
    const history = getSearchHistory(20);
    return NextResponse.json({ history });
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ history: [] });
  }
}
