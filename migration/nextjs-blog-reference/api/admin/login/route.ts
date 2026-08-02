import { NextResponse } from 'next/server';
import { createSession } from '@/data/authService';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.ADMIN_EMAIL;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (email === expectedEmail && password === expectedPassword) {
      await createSession('admin-user');
      return NextResponse.json({ success: true, message: 'Logged in successfully' }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
