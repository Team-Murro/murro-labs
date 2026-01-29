// app/terms/page.tsx
'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen p-6 font-sans text-slate-300">
      <div className="max-w-2xl mx-auto">
        {/* 상단 네비게이션 */}
        <div className="mb-8">
            <Link href="/" className="text-xs font-mono text-slate-500 hover:text-white transition-colors">
            ← BACK TO HOME
            </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-8 font-mono border-b border-slate-700 pb-4">
            서비스 이용약관
        </h1>

        <div className="space-y-8 text-sm leading-relaxed">
            <section>
                <h2 className="text-lg font-bold text-slate-100 mb-2">제1조 (목적)</h2>
                <p>본 약관은 Team. MURRO(이하 "회사")가 제공하는 MURRO LABS 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-slate-100 mb-2">제2조 (서비스의 내용 및 면책)</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>본 서비스가 제공하는 로또 번호 예측, 운세 분석, 메뉴 추천 등은 AI 및 통계 알고리즘에 기반한 참고용 데이터입니다.</li>
                    <li><strong className="text-red-400">회사는 제공된 정보의 정확성, 신뢰성, 적중률을 보장하지 않으며, 이를 활용한 결과에 대해 어떠한 법적 책임도 지지 않습니다.</strong></li>
                    <li>모든 투자의 책임은 사용자 본인에게 있으며, 서비스 이용 결과로 발생하는 손해에 대해 회사는 책임을 지지 않습니다.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-slate-100 mb-2">제3조 (개인정보의 보호)</h2>
                <p>회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-slate-100 mb-2">제4조 (광고의 게재)</h2>
                <p>회사는 서비스 운영과 관련하여 서비스 화면에 광고를 게재할 수 있습니다. 회원은 서비스 이용 시 노출되는 광고 게재에 동의하는 것으로 간주합니다.</p>
            </section>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
            Last Updated: 2026.01.21
        </div>
      </div>
    </div>
  );
}
