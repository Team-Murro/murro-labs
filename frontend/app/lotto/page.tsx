'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LottoPage() {
  const [lotto, setLotto] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  useEffect(() => {
    fetch('/api/lotto/latest').then(res => res.json()).then(data => setLotto(data));
    // 명예의 전당 데이터 (최근 10회차 등)
    fetch('/api/lotto/history').then(res => res.json()).then(data => setHistory(data));
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
      <header className="w-full max-w-3xl flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white font-bold">← 대시보드</Link>
        <h1 className="text-xl font-black text-blue-400">LOTTO HONOR HALL</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-3xl space-y-8">
        {/* 최근 당첨 정보 시각화 */}
        <section className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700 text-center">
          <h2 className="text-xs font-bold text-slate-500 mb-6 tracking-[0.2em]">LATEST WINNING NUMBERS</h2>
          {lotto && (
            <>
              <p className="text-4xl font-black mb-6">{lotto.turn}회</p>
              <div className="flex justify-center gap-2 mb-2">
                {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
                  <span key={i} className={`w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold border-b-4 border-black/30 ${getBallColor(n)}`}>{n}</span>
                ))}
                <span className="text-3xl mx-1 text-slate-600">+</span>
                <span className={`w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold border-b-4 border-black/30 ${getBallColor(lotto.bonus)}`}>{lotto.bonus}</span>
              </div>
              <p className="text-xs text-slate-500 mt-4">추첨일: {lotto.draw_date}</p>
            </>
          )}
        </section>

        {/* AI 번호 생성 */}
        <section className="p-6 bg-slate-800/30 rounded-3xl border border-slate-700">
          <button onClick={fetchPrediction} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black transition-all">
            {loading ? "분석 엔진 가동 중..." : "AI 행운의 번호 받기 🎲"}
          </button>
          {prediction.length > 0 && (
            <div className="mt-6 flex justify-center gap-2 animate-bounce">
              {prediction.map((n, i) => (
                <span key={i} className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold border-b-4 border-black/30 ${getBallColor(n)}`}>{n}</span>
              ))}
            </div>
          )}
        </section>

        {/* 명예의 전당 (리스트) 복구 */}
        <section className="w-full">
          <h2 className="text-lg font-bold mb-4 px-2 italic"># 명예의 전당</h2>
          <div className="bg-slate-800/50 rounded-3xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="px-6 py-4">회차</th>
                  <th className="px-6 py-4 text-center">당첨 번호</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-bold">{h.turn}회</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        {[h.num1, h.num2, h.num3, h.num4, h.num5, h.num6].map((n, idx) => (
                          <span key={idx} className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${getBallColor(n)}`}>{n}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}