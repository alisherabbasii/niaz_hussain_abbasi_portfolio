import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Cloud upload if token is present
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: blob.url }, { status: 200 });
    }

    // Local fallback for development
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const fileName = `${Date.now()}-${originalName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'blog-images');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ url: `/blog-images/${fileName}` }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
