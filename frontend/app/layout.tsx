import type { Metadata } from "next";
import { Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import Link from "next/link"; // [1] Link 컴포넌트 추가
import "./globals.css";

// 1. 본문용 한글 폰트
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto",
});

// 2. 숫자/데이터용 폰트
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MURRO LABS",
  description: "데이터로 일상을 연구합니다. Team. MURRO",
  icons: {
    icon: "/favicon.ico", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} ${jetbrainsMono.variable} antialiased bg-[#0f172a] text-slate-200 flex flex-col min-h-screen`}
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2750038264249060"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* [Header] */}
        <header className="w-full border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* [2] 로고 클릭 시 홈으로 이동 */}
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-mono font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 cursor-pointer">
                MURRO LABS
              </h1>
            </Link>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono border border-slate-700">
              v1.0
            </span>
          </div>
        </header>

        {/* [Main] */}
        <main className="flex-grow w-full max-w-2xl mx-auto">
          {children}
        </main>

        {/* [Footer] */}
        <footer className="w-full border-t border-slate-800 bg-[#0b1120] mt-20 py-10">
          <div className="max-w-2xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="font-bold text-slate-200 text-lg mb-2 font-mono">Team. MURRO</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  우리는 데이터와 AI 기술을 통해<br/>
                  불확실한 일상에 확실한 즐거움을 더합니다.
                </p>
              </div>
              
              <div className="flex flex-col md:items-end gap-2 text-xs text-slate-400">
                {/* [3] 약관 페이지 링크 연결 */}
                <Link href="/terms" className="hover:text-blue-400 transition-colors">서비스 이용약관</Link>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">개인정보처리방침</Link>
                <a href="mailto:support@murro.co.kr" className="hover:text-blue-400 transition-colors">
                  제휴/문의: support@murro.co.kr
                </a>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-600 font-mono">
              <p>© 2026 Team. MURRO. All rights reserved.</p>
              <p className="mt-1 md:mt-0">Designed by MURRO LABS</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
