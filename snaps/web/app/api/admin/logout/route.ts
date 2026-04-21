import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@web/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const url = new URL('/admin/login', req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
