import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/auth/session';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  clearAdminSessionCookie(res);
  return res;
}
