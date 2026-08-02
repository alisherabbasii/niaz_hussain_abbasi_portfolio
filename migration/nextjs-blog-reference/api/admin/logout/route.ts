import { NextResponse } from 'next/server';
import { deleteSession } from '@/data/authService';

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true }, { status: 200 });
}
