import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const uploadsDirectory = path.join(process.cwd(), '.data', 'uploads');
const mimeTypeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export async function GET(_: Request, { params }: { params: { filename: string } }) {
  const match = params.filename.match(/^[a-f0-9-]{36}\.(jpg|png|gif|webp)$/i);
  if (!match) return new NextResponse(null, { status: 404 });

  try {
    const image = await readFile(path.join(uploadsDirectory, params.filename));
    return new NextResponse(image, {
      headers: {
        'Content-Type': mimeTypeByExtension[match[1].toLowerCase()],
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}