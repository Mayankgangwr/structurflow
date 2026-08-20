import { NextResponse, type NextRequest } from "next/server";

// Add paths that require authentication here
const protectedPaths = ['/dashboard', '/settings'];

// Add paths that authenticated users shouldn't see
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // We check for the refresh token cookie as the source of truth for "logged in" state
    const hasRefreshToken = request.cookies.has('refreshToken');

    // 1. If user is trying to access a protected route without a token
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtectedPath && !hasRefreshToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. If user is trying to access auth pages (like /login) while already logged in
    const isAuthPath = authPaths.some(path => pathname.startsWith(path));
    if (isAuthPath && hasRefreshToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Optimize middleware to only run on relevant paths

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};