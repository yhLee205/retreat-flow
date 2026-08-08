import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// IP별 최근 요청 기록 저장 (메모리 내 Sliding Window Rate Limiter)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit 설정
const WINDOW_MS = 10 * 1000; // 10초 윈도우
const MAX_API_REQUESTS = 25; // 10초당 API 요청 최대 25회 (DDoS / 연사 방지)
const MAX_PAGE_REQUESTS = 60; // 10초당 일반 페이지 요청 최대 60회 (연속 새로고침 방지)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static 파일, _next 내부 리소스는 미들웨어 제외
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 클라이언트 IP 구별 (x-forwarded-for 헤더 또는 기본값)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const now = Date.now();
  const rateLimitKey = `${ip}:${pathname.startsWith("/api") ? "api" : "page"}`;
  const maxLimit = pathname.startsWith("/api") ? MAX_API_REQUESTS : MAX_PAGE_REQUESTS;

  const currentLimit = rateLimitMap.get(rateLimitKey);

  if (!currentLimit || now > currentLimit.resetTime) {
    // 윈도우 초기화
    rateLimitMap.set(rateLimitKey, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
  } else {
    currentLimit.count += 1;

    // 초과 시 429 Too Many Requests 차단
    if (currentLimit.count > maxLimit) {
      if (pathname.startsWith("/api")) {
        return new NextResponse(
          JSON.stringify({
            error: "트래픽 초과: 너무 많은 요청이 감지되었습니다. 5초 후 다시 시도해 주세요.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Retry-After": "5",
            },
          }
        );
      } else {
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>요청 제한 (Rate Limit Exceeded)</title>
            <style>
              body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #fff; text-align: center; }
              .box { background: #1e293b; padding: 2rem; border-radius: 1.5rem; max-width: 360px; border: 1px solid #334155; }
              h1 { font-size: 1.25rem; color: #f43f5e; margin-bottom: 0.5rem; }
              p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>⚠️ 연속 요청 제한 (DDoS 방지)</h1>
              <p>과도한 연속 새로고침 및 요청이 감지되었습니다.<br/>서버 보호를 위해 약 5초 후 자동으로 해제됩니다.</p>
            </div>
          </body>
          </html>
          `,
          {
            status: 429,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Retry-After": "5",
            },
          }
        );
      }
    }
  }

  // 메모리 누수 방지: 만료된 레코드 100개 이상 시 정리
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const response = NextResponse.next();

  // 보안 강화 헤더 추가
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
