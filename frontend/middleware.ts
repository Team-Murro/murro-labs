// frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 1. 우리가 보호하고 싶은 경로인지 확인 ('/admin'으로 시작하는 모든 곳)
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    // 2. 브라우저가 보낸 인증 정보 확인
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      // "Basic abc1234..." 형태의 값을 해독
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // 3. 환경변수에 설정한 ID/PW와 일치하는지 검사
      // (만약 환경변수가 없으면 기본값 admin / 1234 로 동작)
      const validUser = process.env.ADMIN_USER || 'admin';
      const validPass = process.env.ADMIN_PASSWORD || '1234';

      if (user === validUser && pwd === validPass) {
        return NextResponse.next(); // 통과!
      }
    }

    // 4. 인증 실패 시 로그인 창 띄우기 (401 에러 리턴)
    return new NextResponse('관리자 권한이 필요합니다.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // 관리자 페이지가 아니면 그냥 통과
  return NextResponse.next();
}

// 미들웨어가 동작할 경로 설정 (이미지 파일 등은 제외)
export const config = {
  matcher: ['/admin/:path*'],
};