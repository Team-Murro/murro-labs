'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [lotto, setLotto] = useState<any>(null);

  useEffect(() => {
    fetch('/api/lotto/latest').then(res => res.json()).then(data => setLotto(data));
  }, []);

  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  return (
    <div className="flex flex-col items-center min-h-screen text-white p-4 font-sans bg-gray-900">
      <div className="w-full mb-8 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 max-w-2xl aspect-[3/1]">
         <Image src="/hero-banner.jpg" alt="MURRO LABS" fill className="object-cover" priority />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6">
            <p className="text-xs text-slate-300 font-medium">데이터와 AI로 일상의 행운을 실험하다</p>
         </div>
      </div>

      <div className="w-full max-w-2xl space-y-10">
        {/* 🧪 머로 연구소 */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center px-2 font-mono"><span className="mr-2">🧬</span> MURRO LAB</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => router.push('/lotto')} className="md:col-span-2 p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-blue-400">🎲 로또 분석</h3>
                <span className="text-slate-500 group-hover:text-white transition-colors">리포트 확인 →</span>
              </div>
              {lotto && (
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black font-mono">{lotto.turn}회</span>
                  <div className="flex gap-1">
                    {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n: number, i: number) => (
                      <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold border-b-2 ${getBallColor(n)}`}>{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div onClick={() => router.push('/fortune')} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all">
               <h3 className="text-sm font-bold text-purple-400 mb-2">🔮 오늘의 운세</h3>
               <p className="text-xs text-slate-400 leading-relaxed">개인 사주 기반<br/>맞춤형 행운 리포트</p>
            </div>

            <div onClick={() => router.push('/menu')} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all">
               <h3 className="text-sm font-bold text-orange-400 mb-2">🍽️ 메뉴 추천</h3>
               <p className="text-xs text-slate-400 leading-relaxed">기상청 날씨 기반<br/>최적의 식사 제안</p>
            </div>
          </div>
        </section>

        {/* 🎡 머로 놀이터 */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center px-2 font-mono"><span className="mr-2">🎡</span> PLAYGROUND</h2>
          <Link href="/balance" className="block p-6 bg-slate-800 border border-slate-700 rounded-3xl hover:border-red-500/50 transition-all shadow-lg group">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center text-2xl border border-red-500/20 group-hover:scale-110 transition-transform">⚖️</div>
                <div>
                  <h3 className="font-bold text-slate-200 group-hover:text-red-400 transition-colors">무한 밸런스 게임</h3>
                  <p className="text-xs text-slate-500 mt-1">당신의 선택으로 완성되는 데이터</p>
                </div>
              </div>
              <span className="text-slate-600 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </section>

        {/* 📚 머로 라이프 */}
        <section className="pb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center px-2 font-mono"><span className="mr-2">📚</span> MURRO LIFE</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/weather" className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 hover:border-emerald-500/50 transition-all group">
               <h3 className="text-sm font-bold text-emerald-400 mb-2">🌦️ 오늘의 날씨</h3>
               <p className="text-[11px] text-slate-400 leading-relaxed">내 동네 실시간 날씨 정보를<br/>기상청 데이터로 확인하세요.</p>
            </Link>

            {/* [수정] Preparing 빈칸 -> 오늘의 뉴스 카드 */}
            <Link href="/news" className="block w-full h-full">
                <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800 transition-all cursor-pointer group h-full relative overflow-hidden flex flex-col justify-between">
                    {/* 배경 데코레이션 */}
                    <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all rotate-12">
                        📰
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-bold text-yellow-400">⚡ 오늘의 뉴스</h3>
                            <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30">New</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            AI가 엄선한 3줄 요약<br/>
                            주요 토픽 브리핑
                        </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <span className="text-xs text-yellow-500/50 font-bold group-hover:text-yellow-400 group-hover:translate-x-1 transition-all">
                            확인하기 →
                        </span>
                    </div>
                </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}