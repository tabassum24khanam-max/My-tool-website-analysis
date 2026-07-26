import { NextRequest, NextResponse } from 'next/server';
import { saveFavourite, removeFavourite, getSavedCompanies } from '@/lib/db';

export async function GET() {
  try {
    const saved = getSavedCompanies();
    return NextResponse.json({ saved });
  } catch (err) {
    console.error('Saved companies error:', err);
    return NextResponse.json({ saved: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, action } = body;
    if (!domain) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
    }
    if (action === 'remove') {
      removeFavourite(domain);
    } else {
      saveFavourite(domain);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
