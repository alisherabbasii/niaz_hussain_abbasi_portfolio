import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { verifySession } from '@/data/authService';

export async function GET() {
  // Only allow admins to migrate
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isCloudEnabled = !!process.env.KV_REST_API_URL;
    if (!isCloudEnabled) {
      return NextResponse.json({ error: 'KV_REST_API_URL is not set.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'data', 'blogs');
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ message: 'No local blogs to migrate.' }, { status: 200 });
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    let migrateCount = 0;

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const blog = JSON.parse(content);

      // sync to kv
      await kv.hset('blogs', { [blog.slug]: blog });
      migrateCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${migrateCount} blogs to Vercel KV.` 
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
