import { auth } from './auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;
  const role = (session?.role || session?.user?.role || '').toString().toLowerCase();
  const isAuthValid = Boolean(session?.accessToken) && !session?.error;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthValid) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // if (!['admin', 'sub-admin'].includes(role)) {
    //   return NextResponse.redirect(new URL('/unauthorized', req.url));
    // }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth')) {
    if (isAuthValid) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
};
