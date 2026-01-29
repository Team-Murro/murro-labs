// app/privacy/page.tsx
'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
                개인정보 처리방침
            </h1>

            <div className="space-y-8 text-sm leading-relaxed">
                <section>
                    <p className="mb-4">
                        Team. MURRO('MURRO LABS')는 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-100 mb-2">1. 수집하는 개인정보 항목</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>운세 서비스:</strong> 생년월일, 태어난 시간, 성별</li>
                        <li><strong>메뉴 추천/지도:</strong> 현재 위치 정보(위도, 경도)</li>
                        <li><strong>로또 명예의 전당:</strong> 사용자가 입력한 닉네임</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-100 mb-2">2. 개인정보의 처리 목적 및 보유기간</h2>
                    <p className="mb-2">회사는 수집한 정보를 다음의 목적을 위해서만 활용합니다.</p>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>운세 및 메뉴 추천 데이터 분석:</strong> 입력하신 정보는 결과 산출 즉시 파기되며, <span className="text-emerald-400 font-bold">서버에 별도로 저장되지 않습니다.</span></li>
                            <li><strong>위치 정보:</strong> 사용자 브라우저 내에서만 일시적으로 사용되며 서버로 전송되어 저장되지 않습니다.</li>
                            <li><strong>명예의 전당:</strong> 닉네임과 예측 기록은 서비스 제공 기간 동안 데이터베이스에 보관됩니다.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-100 mb-2">3. 제3자 제공 및 위탁</h2>
                    <p>회사는 이용자의 동의 없이 개인정보를 외부에 제공하거나 위탁하지 않습니다. 단, 통계 작성을 위해 개인을 식별할 수 없는 형태로 가공된 정보는 사용될 수 있습니다.</p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-100 mb-2">4. 개인정보 보호책임자</h2>
                    <p>서비스 이용과 관련한 개인정보 문의는 아래 메일로 연락주시기 바랍니다.</p>
                    <p className="mt-2 font-mono text-blue-400">support@murro.co.kr</p>
                </section>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
                Last Updated: 2026.01.21
            </div>
        </div>
    </div>
  );
}
