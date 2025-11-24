import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge Runtime에서는 Node.js 모듈을 사용할 수 없으므로
// 단순히 토큰 존재 여부만 확인하고, 실제 검증은 각 페이지/API에서 수행
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 로그인 페이지는 토큰이 있으면 리다이렉트 (실제 검증은 페이지에서)
  if (pathname.startsWith('/auth/login')) {
    if (token) {
      // 토큰이 있으면 대시보드로 리다이렉트 (실제 role 검증은 페이지에서)
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 보호된 페이지는 토큰이 없으면 로그인 페이지로 리다이렉트
  // 실제 role 검증은 각 페이지의 서버 컴포넌트나 API에서 수행
  if (pathname.startsWith('/admin') || pathname.startsWith('/reviewer')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/reviewer/:path*',
    '/auth/login',
  ],
};

