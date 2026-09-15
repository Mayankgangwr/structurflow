import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ['/dashboard', '/project', '/settings'];
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Better-Auth uses "better-auth.session_token" locally and "__Secure-better-auth.session_token" on HTTPS
    const hasSession =
        request.cookies.has('better-auth.session_token') ||
        request.cookies.has('__Secure-better-auth.session_token');

    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
    if (isProtectedPath && !hasSession) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const isAuthPath = authPaths.some(path => pathname.startsWith(path));
    if (isAuthPath && hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
