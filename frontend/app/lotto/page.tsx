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

  // 공 색상 로직 (그림자 및 입체감 추가)
  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600 shadow-yellow-500/20';
    if (num <= 20) return 'bg-blue-500 border-blue-600 shadow-blue-500/20';
    if (num <= 30) return 'bg-red-500 border-red-600 shadow-red-500/20';
    if (num <= 40) return 'bg-gray-500 border-gray-600 shadow-gray-500/20';
    return 'bg-green-500 border-green-600 shadow-green-500/20';
  };

  // 등수 배지 스타일
  const getRankBadge = (rank: string) => {
    if (rank === '1등') return 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg';
    if (rank === '2등') return 'bg-orange-500 text-white shadow-orange-500/50 shadow-md';
    if (rank === '3등') return 'bg-yellow-400 text-black shadow-yellow-400/50 shadow-md';
    if (rank === '4등') return 'bg-blue-500 text-white shadow-blue-500/50 shadow-md';
    if (rank === '5등') return 'bg-green-500 text-white shadow-green-500/50 shadow-md';
    return 'bg-slate-700 text-slate-400 border border-slate-600';
  };

  // 매칭 스타일 (맞으면 반짝임 강조)
  const getMatchStyle = (myNum: number) => {
    if (!boardWinning) return "";
    const winNums = [boardWinning.num1, boardWinning.num2, boardWinning.num3, boardWinning.num4, boardWinning.num5, boardWinning.num6];
    if (winNums.includes(myNum)) return "ring-2 ring-emerald-400 scale-110 z-10 brightness-110";
    if (boardWinning.bonus === myNum) return "ring-2 ring-yellow-400 scale-110 z-10 brightness-110";
    return "opacity-60 grayscale-[0.3]"; // 낙첨 번호는 살짝만 흐리게
  };

  const getMatchBadge = (myNum: number) => {
    if (!boardWinning) return null;
    const winNums = [boardWinning.num1, boardWinning.num2, boardWinning.num3, boardWinning.num4, boardWinning.num5, boardWinning.num6];
    if (winNums.includes(myNum)) return <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-900 z-20 shadow-sm">✓</span>;
    if (boardWinning.bonus === myNum) return <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-900 z-20 shadow-sm">B</span>;
    return null;
  };

  useEffect(() => {
    fetch('/api/lotto/latest').then(res => res.json()).then(data => {
      if (data.turn) {
        setLotto(data);
        const next = data.turn + 1;
        setCurrentTurn(next);
        setBoardTurn(next);
        fetchHallOfFame(next);
      }
    });
  }, []);

  const fetchHallOfFame = async (turn: number) => {
    try {
      const res = await fetch(`/api/predictions/${turn}`);
      const data = await res.json();
      setHallOfFame(data);
      const resLotto = await fetch(`/api/lotto/${turn}`);
      if (resLotto.ok) setBoardWinning(await resLotto.json());
      else setBoardWinning(null);
    } catch (e) { setBoardWinning(null); }
  };

  const fetchPrediction = async () => {
    setLoading(true);
    const res = await fetch('/api/lotto/predict');
    const data = await res.json();
    if (data.predicted_numbers) setPrediction(data.predicted_numbers);
    setLoading(false);
  };

  const handleRegisterAll = async () => {
    let username = prompt(`닉네임을 입력해주세요:`);
    if (!username) username = "익명";
    const payload = { turn: currentTurn, games: prediction, username };
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) { alert("등록 완료!"); fetchHallOfFame(currentTurn); }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <header className="w-full max-w-2xl flex justify-between py-6">
        <Link href="/" className="text-slate-400 font-bold hover:text-white transition-colors">← BACK</Link>
        <h1 className="text-xl font-bold">🎲 로또 분석</h1>
        <div className="w-10"></div>
      </header>

      <div className="w-full max-w-2xl space-y-6 pb-20">
        {/* 최신 결과 섹션 */}
        <div className="p-6 border border-slate-700 rounded-3xl bg-slate-800/50 shadow-xl text-center">
          {lotto ? (
            <>
              <div className="inline-block bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-[10px] mb-3 border border-blue-800 uppercase font-mono tracking-widest">Latest Draw</div>
              <h2 className="text-3xl font-bold mb-1">{lotto.turn}회 결과</h2>
              <p className="text-slate-400 text-xs mb-6 font-mono">{lotto.draw_date}</p>
              <div className="flex justify-center items-center gap-2">
                {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((num, i) => (
                  <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold border-b-4 ${getBallColor(num)}`}>{num}</div>
                ))}
                <span className="text-slate-500 font-bold mx-1">+</span>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold border-b-4 ${getBallColor(lotto.bonus)}`}>{lotto.bonus}</div>
              </div>
            </>
          ) : <div className="py-10 animate-pulse text-slate-500">데이터 로딩 중...</div>}
        </div>

        <button onClick={fetchPrediction} disabled={loading} className="w-full py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98]">
          {loading ? "AI 분석중..." : `✨ ${currentTurn > 0 ? currentTurn : ''}회차 번호 생성`}
        </button>

        {prediction.length > 0 && (
          <div className="space-y-4 animate-fade-in-up">
            {prediction.map((game, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-700 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-slate-300 text-lg">{String.fromCharCode(65 + idx)}</span>
                  <div className="flex gap-2">
                    {game.map((num, i) => (<div key={i} className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold border-b-4 ${getBallColor(num)}`}>{num}</div>))}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleRegisterAll} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.98]">🏆 명예의 전당 등록</button>
          </div>
        )}

        {/* [개선됨] 명예의 전당 및 회차 선택 표시 */}
        <div className="p-6 bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">🏆 명예의 전당</h3>
            <select value={boardTurn} onChange={(e) => {const t = parseInt(e.target.value); setBoardTurn(t); fetchHallOfFame(t);}} className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm focus:outline-none focus:border-blue-500">
              {currentTurn > 0 && Array.from({length: 5}, (_, i) => currentTurn - i).map(t => (
                <option key={t} value={t}>
                    {t}회 {t === currentTurn ? "(진행중)" : t === currentTurn - 1 ? "(최신결과)" : ""}
                </option>
              ))}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm">
              <thead className="bg-slate-800 text-slate-400 border-b border-slate-700 uppercase text-[10px] tracking-widest font-mono">
                <tr><th className="pb-3 text-left pl-2">닉네임</th><th className="pb-3">선택 번호</th><th className="pb-3">결과</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {hallOfFame.length === 0 ? <tr><td colSpan={3} className="py-8 text-slate-500">데이터가 없습니다.</td></tr> : hallOfFame.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    {/* 닉네임 */}
                    <td className="py-4 text-slate-300 font-bold text-left pl-2 max-w-[80px] truncate">
                        {item.username}
                    </td>
                    
                    {/* [수정] 번호 공 크기 확대 (w-7->w-8, text-xs->text-sm, font-bold) */}
                    <td className="py-4">
                      <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                        {[item.p_num1, item.p_num2, item.p_num3, item.p_num4, item.p_num5, item.p_num6].map((n, idx) => (
                          <div key={idx} className="relative group">
                            <span className={`
                                flex items-center justify-center rounded-full text-white shadow-md border-b-2
                                w-8 h-8 text-sm font-extrabold     /* 모바일: 32px, 굵은 폰트 */
                                md:w-9 md:h-9 md:text-base         /* PC: 36px, 더 큰 폰트 */
                                ${getBallColor(n)} ${getMatchStyle(n)}
                            `}>
                                {n}
                            </span>
                            {getMatchBadge(n)}
                          </div>
                        ))}
                      </div>
                    </td>
                    
                    {/* 등수 배지 */}
                    <td className="py-4">
                        <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold min-w-[40px] ${getRankBadge(item.rank)}`}>
                            {item.rank}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/map" className="p-6 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors hover:border-emerald-500/50 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🗺️</span>
            <span className="font-bold text-sm text-emerald-400">주변 판매점</span>
          </Link>
          <Link href="/ranking" className="p-6 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors hover:border-yellow-500/50 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🏆</span>
            <span className="font-bold text-sm text-yellow-400">당첨점 TOP 100</span>
          </Link>
        </div>
      </div>
    </div>
  );
}