'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LottoPage() {
  const [lotto, setLotto] = useState<any>(null);
  const [prediction, setPrediction] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/lotto/latest').then(res => res.json()).then(data => setLotto(data));
  }, []);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lotto/predict');
      const data = await res.json();
      setPrediction(data.predicted_numbers);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f172a] text-white p-6">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white">← 돌아가기</Link>
        <h1 className="text-xl font-bold">로또 분석 연구소</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        {/* 최근 당첨 정보 */}
        <section className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700">
          <h2 className="text-sm font-bold text-blue-400 mb-4 font-mono">LATEST RESULT</h2>
          {lotto && (
            <div className="text-center">
              <p className="text-3xl font-black mb-4">{lotto.turn}회 당첨번호</p>
              <div className="flex justify-center gap-2">
                {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
                  <span key={i} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700 font-bold border-b-4 border-slate-900">{n}</span>
                ))}
                <span className="text-2xl mx-1">+</span>
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 font-bold border-b-4 border-blue-900">{lotto.bonus}</span>
              </div>
            </div>
          )}
        </section>

        {/* AI 예측 섹션 */}
        <section className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 text-center">
          <h2 className="text-sm font-bold text-emerald-400 mb-6 font-mono">AI PREDICTION</h2>
          <button 
            onClick={fetchPrediction}
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? "분석 중..." : "AI 행운 번호 생성하기 🎲"}
          </button>

          {prediction.length > 0 && (
            <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-emerald-500/30 animate-in fade-in zoom-in duration-500">
              <p className="text-xs text-emerald-400 mb-4 font-bold">이번 주 분석 추천 번호</p>
              <div className="flex justify-center gap-2">
                {prediction.map((n, i) => (
                  <span key={i} className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-700 font-bold border-b-4 border-emerald-900">{n}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}