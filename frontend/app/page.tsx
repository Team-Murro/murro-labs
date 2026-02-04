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
      {/* 배너 */}
      <div className="w-full mb-8 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 max-w-2xl aspect-[3/1]">
         <Image src="/hero-banner.jpg" alt="MURRO LABS" fill className="object-cover" priority />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6">
            <div>
               <p className="text-xs text-slate-300">데이터와 AI로 일상의 행운을 실험하다</p>
            </div>
         </div>
      </div>

      <div className="w-full max-w-2xl space-y-10">
        {/* 🧪 머로 연구소 (기존 유지) */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center px-2"><span className="mr-2">🧬</span> 머로 연구소</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => router.push('/lotto')} className="md:col-span-2 p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-blue-400">🎲 로또 분석</h3>
                <span className="text-slate-500 group-hover:text-white transition-colors">분석 및 명예의 전당 →</span>
              </div>
              {lotto && (
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black">{lotto.turn}회</span>
                  <div className="flex gap-1">
                    {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
                      <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold border-b-2 ${getBallColor(n)}`}>{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div onClick={() => router.push('/fortune')} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800">
               <h3 className="text-sm font-bold text-purple-400 mb-2">🔮 오늘의 운세</h3>
               <p className="text-xs text-slate-400 leading-relaxed">사주 데이터를 분석하여<br/>오늘의 총운과 행운 요소를 알려드립니다.</p>
            </div>

            <div onClick={() => router.push('/menu')} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800">
               <h3 className="text-sm font-bold text-orange-400 mb-2">🍽️ 메뉴 추천</h3>
               <p className="text-xs text-slate-400 leading-relaxed">위치와 날씨 데이터를 기반으로<br/>최적의 메뉴 6가지를 제안합니다.</p>
            </div>
          </div>
        </section>

        {/* 🎡 머로 놀이터 (기존 유지) */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center px-2"><span className="mr-2">🎡</span> 머로 놀이터</h2>
          <Link href="/balance" className="block p-6 bg-slate-800 border border-slate-700 rounded-3xl hover:border-red-500/50 transition-all shadow-lg group">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center text-2xl border border-red-500/20 group-hover:scale-110 transition-transform">⚖️</div>
                <div>
                  <h3 className="font-bold text-slate-200 group-hover:text-red-400 transition-colors">무한 밸런스 게임</h3>
                  <p className="text-xs text-slate-500 mt-1">세상의 모든 난제, 당신의 선택은?</p>
                </div>
              </div>
              <span className="text-slate-600 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </section>

        {/* 📚 머로 라이프 (오늘의 날씨 추가) */}
        <section className="pb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center px-2"><span className="mr-2">📚</span> 머로 라이프</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/weather" className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 hover:border-emerald-500/50 transition-all group">
               <h3 className="text-sm font-bold text-emerald-400 mb-2">🌦️ 오늘의 날씨</h3>
               <p className="text-[11px] text-slate-400 leading-relaxed">기상청 실시간 데이터를 기반으로<br/>동네 날씨 정보를 알려드립니다.</p>
            </Link>
            {/* 남은 하나는 유지 */}
            <div className="p-8 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center opacity-30">
               <span className="text-xl mb-1">🚧</span>
               <span className="text-[10px] font-mono tracking-widest uppercase">Preparing</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}