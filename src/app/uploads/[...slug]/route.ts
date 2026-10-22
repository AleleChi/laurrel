import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    if (!params.slug || params.slug.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Sanitize path segments to prevent directory traversal
    const safeSegments = params.slug.map((s) => path.basename(s));
    const uploadsBase = path.resolve(process.cwd(), 'public', 'uploads');
    const targetFilePath = path.join(uploadsBase, ...safeSegments);

    // Verify target path remains within public/uploads
    if (!targetFilePath.startsWith(uploadsBase)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(targetFilePath) || fs.statSync(targetFilePath).isDirectory()) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const ext = path.extname(targetFilePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    const fileBuffer = await fs.promises.readFile(targetFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[Uploads Route] Error serving file:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
