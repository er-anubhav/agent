import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Guest access is no longer allowed - redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
