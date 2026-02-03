'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LottoPage() {
  const [lotto, setLotto] = useState<any>(null);
  const [prediction, setPrediction] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);
  const [hallOfFame, setHallOfFame] = useState<any[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [boardTurn, setBoardTurn] = useState<number>(0);
  const [boardWinning, setBoardWinning] = useState<any>(null);

  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  useEffect(() => {
    fetch('/api/lotto/latest').then(res => res.json()).then(data => {
      setLotto(data);
      if (data.turn) {
        const next = data.turn + 1;
        setCurrentTurn(next);
        setBoardTurn(next);
        fetchHallOfFame(next);
      }
    });
  }, []);

  const fetchHallOfFame = async (turn: number) => {
    const res = await fetch(`/api/predictions/${turn}`);
    const data = await res.json();
    setHallOfFame(data);
    const resLotto = await fetch(`/api/lotto/${turn}`);
    if (resLotto.ok) setBoardWinning(await resLotto.json());
    else setBoardWinning(null);
  };

  const fetchPrediction = async () => {
    setLoading(true);
    const res = await fetch('/api/lotto/predict');
    const data = await res.json();
    if (data.predicted_numbers) setPrediction(data.predicted_numbers);
    setLoading(false);
  };

  const handleRegisterAll = async () => {
    if (prediction.length === 0) return;
    let username = prompt(`닉네임을 입력해주세요:`);
    if (username === null) return;
    if (username.trim() === "") username = "익명";

    const payload = { turn: currentTurn, games: prediction, username };
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("등록 완료!");
      fetchHallOfFame(currentTurn);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <header className="w-full max-w-2xl flex justify-between py-6">
        <Link href="/" className="text-slate-400 font-bold">← BACK</Link>
        <h1 className="text-xl font-bold">로또 분석 연구소</h1>
        <div className="w-10"></div>
      </header>

      <div className="w-full max-w-2xl space-y-8 pb-20">
        {/* 최근 당첨번호 (기존 스타일 완벽 복구) */}
        <section className="p-6 border border-slate-700 rounded-3xl bg-slate-800/50 text-center shadow-xl">
           <h2 className="text-3xl font-black mb-1">{lotto?.turn}회 결과</h2>
           <p className="text-slate-500 text-xs mb-6">{lotto?.draw_date}</p>
           <div className="flex justify-center gap-2">
             {lotto && [lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
               <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold border-b-4 ${getBallColor(n)}`}>{n}</div>
             ))}
             <span className="text-2xl text-slate-600">+</span>
             <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold border-b-4 ${getBallColor(lotto?.bonus)}`}>{lotto?.bonus}</div>
           </div>
        </section>

        <button onClick={fetchPrediction} disabled={loading} className="w-full py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] transition-transform">
          {loading ? "분석중..." : `✨ ${currentTurn}회차 번호 생성`}
        </button>

        {prediction.length > 0 && (
          <div className="space-y-4 animate-fade-in-up">
            {prediction.map((game, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-2xl">
                 <span className="w-8 font-mono text-slate-500">{String.fromCharCode(65+idx)}</span>
                 <div className="flex gap-2">
                   {game.map((n, i) => <div key={i} className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold border-b-2 ${getBallColor(n)}`}>{n}</div>)}
                 </div>
              </div>
            ))}
            <button onClick={handleRegisterAll} className="w-full py-4 bg-emerald-600 rounded-2xl font-bold">🏆 명예의 전당 등록</button>
          </div>
        )}

        {/* 명예의 전당 섹션 (기존 테이블 및 회차 선택 복구) */}
        <section className="p-6 bg-slate-800/80 rounded-3xl border border-slate-700">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">🏆 명예의 전당</h3>
              <select value={boardTurn} onChange={(e) => {setBoardTurn(parseInt(e.target.value)); fetchHallOfFame(parseInt(e.target.value));}} className="bg-slate-700 border-none rounded-lg text-sm p-1">
                {currentTurn > 0 && Array.from({length: 5}, (_, i) => currentTurn - i).map(t => <option key={t} value={t}>{t}회</option>)}
              </select>
           </div>
           <table className="w-full text-center text-sm">
             <tbody className="divide-y divide-slate-700">
               {hallOfFame.length === 0 ? <tr><td className="py-10 text-slate-500">등록된 데이터가 없습니다.</td></tr> : hallOfFame.map(item => (
                 <tr key={item.id}>
                    <td className="py-4 text-xs font-bold">{item.username}</td>
                    <td className="py-4 flex justify-center gap-1">
                      {[item.p_num1, item.p_num2, item.p_num3, item.p_num4, item.p_num5, item.p_num6].map((n, i) => (
                        <span key={i} className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${getBallColor(n)}`}>{n}</span>
                      ))}
                    </td>
                    <td className="py-4 text-[10px] font-bold text-yellow-500">{item.rank}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </section>
      </div>
    </div>
  );
}