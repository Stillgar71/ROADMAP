import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const uploadsDirectory = path.join(process.cwd(), '.data', 'uploads');
const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function hasValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (mimeType === 'image/gif') return new TextDecoder().decode(bytes.slice(0, 6)) === 'GIF87a' || new TextDecoder().decode(bytes.slice(0, 6)) === 'GIF89a';
  if (mimeType === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get('image');

  if (!(image instanceof File) || !extensionByMimeType[image.type]) {
    return NextResponse.json({ error: 'Upload a PNG, JPEG, GIF, or WebP image.' }, { status: 400 });
  }
  if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'Images must be between 1 byte and 5 MB.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!hasValidImageSignature(bytes, image.type)) {
    return NextResponse.json({ error: 'The file content does not match its image type.' }, { status: 400 });
  }

  await mkdir(uploadsDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extensionByMimeType[image.type]}`;
  await writeFile(path.join(uploadsDirectory, filename), bytes);

  return NextResponse.json({ url: `/api/uploads/${filename}` }, { status: 201 });
}