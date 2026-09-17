import { NextResponse, type NextRequest } from "next/server";

// Add paths that require authentication here
const protectedPaths = ['/dashboard', '/project', '/settings'];

// Add paths that authenticated users shouldn't see
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export function proxy(request: NextRequest) {
    // Authentication is verified client-side by AuthGuard via useGetMeQuery
    // because authentication cookies are scoped to the backend API domain on Render.
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