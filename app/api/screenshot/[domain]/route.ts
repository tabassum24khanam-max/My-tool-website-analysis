import { NextRequest, NextResponse } from 'next/server';
import { getScreenshotDir } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const screenshotDir = getScreenshotDir();
    const filePath = path.join(screenshotDir, `${params.domain}.png`);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Screenshot not found', { status: 404 });
    }

    const file = fs.readFileSync(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Error loading screenshot', { status: 500 });
  }
}
