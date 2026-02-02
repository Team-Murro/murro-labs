'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { useRouter } from 'next/navigation';

// --- 타입 정의 ---
interface LottoData {
  turn: number;
  draw_date: string;
  num1: number; num2: number; num3: number; num4: number; num5: number; num6: number;
  bonus: number;
}

interface PredictionRecord {
  id: number;
  username: string;
  p_num1: number; p_num2: number; p_num3: number; p_num4: number; p_num5: number; p_num6: number;
  rank: string;
  turn: number;
}

interface FortuneResult {
  total_score: number;
  comment: string;
  lucky_numbers: number[];
  lucky_color: string;
  wealth_luck: string;
}

interface MenuResult {
  reason: string;
  menus: string[];
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lotto' | 'fortune' | 'menu'>('lotto');

  // --- 로또 상태 ---
  const [lotto, setLotto] = useState<LottoData | null>(null);
  const [prediction, setPrediction] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);
  const [hallOfFame, setHallOfFame] = useState<PredictionRecord[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [boardTurn, setBoardTurn] = useState<number>(0);
  const [boardWinning, setBoardWinning] = useState<LottoData | null>(null);

  // --- 운세 상태 ---
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [gender, setGender] = useState('남성');
  const [fortuneData, setFortuneData] = useState<FortuneResult | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);

  // --- 메뉴 상태 ---
  const [menuData, setMenuData] = useState<MenuResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalMenu, setFinalMenu] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const API_BASE = '';

  // --- 초기 로딩 (최신 로또 회차) ---
  useEffect(() => {
    fetch(`${API_BASE}/api/lotto/latest`)
      .then((res) => {
        if (!res.ok) throw new Error("API Load Failed");
        return res.json();
      })
      .then((data) => {
        if (data.turn) {
          setLotto(data);
          const nextTurn = data.turn + 1;
          setCurrentTurn(nextTurn);
          setBoardTurn(nextTurn);
          fetchHallOfFame(nextTurn);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // --- 함수들 ---
  const fetchHallOfFame = async (turn: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/predictions/${turn}`);
      const data = await res.json();
      setHallOfFame(data);
      const resLotto = await fetch(`${API_BASE}/api/lotto/${turn}`);
      if (resLotto.ok) setBoardWinning(await resLotto.json());
      else setBoardWinning(null);
    } catch (e) { setBoardWinning(null); }
  };

  const handleTurnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTurn = parseInt(e.target.value);
    setBoardTurn(newTurn);
    fetchHallOfFame(newTurn);
  };

  const fetchPrediction = async () => {
    setActiveTab('lotto');
    setLoading(true);
    setPrediction([]);
    try {
      const res = await fetch(`${API_BASE}/api/lotto/predict`);
      const data = await res.json();
      if (data.predicted_numbers) setPrediction(data.predicted_numbers);
    } catch (e) { alert("서버 오류"); }
    finally { setLoading(false); }
  };

  const handleRegisterAll = async () => {
    if (prediction.length === 0) return;
    let username = prompt(`닉네임을 입력해주세요:`);
    if (username === null) return;
    if (username.trim() === "") username = "익명";

    try {
      const payload = { turn: currentTurn, games: prediction, username };
      const res = await fetch(`${API_BASE}/api/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("등록 완료!");
        setBoardTurn(currentTurn);
        fetchHallOfFame(currentTurn);
      }
    } catch (e) { alert("오류 발생"); }
  };

  const fetchFortune = async () => {
    if (!birthDate) return alert("생년월일을 입력해주세요!");
    setFortuneLoading(true);
    setFortuneData(null);
    try {
      const res = await fetch(`${API_BASE}/api/fortune`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, birthTime, gender })
      });
      const data = await res.json();
      setFortuneData(data);
    } catch (error) { alert("운세를 불러오는데 실패했습니다."); } 
    finally { setFortuneLoading(false); }
  };

  const fetchMenus = () => {
    if (!navigator.geolocation) return alert("위치 정보가 필요합니다.");
    setLoading(true);
    setMenuData(null);
    setFinalMenu(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`${API_BASE}/api/menu/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        });
        const data = await res.json();
        setMenuData(data);
      } catch (e) { alert("추천 실패"); }
      finally { setLoading(false); }
    }, () => { alert("위치 권한을 허용해주세요."); setLoading(false); });
  };

  const spinWheel = () => {
    if (!menuData || isSpinning) return;
    setIsSpinning(true);
    setFinalMenu(null);
    const randomDeg = Math.floor(Math.random() * 360);
    const totalDeg = 360 * 5 + randomDeg; 
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
      wheelRef.current.style.transform = `rotate(${totalDeg}deg)`;
    }
    setTimeout(() => {
      setIsSpinning(false);
      const normalizedDeg = randomDeg % 360;
      const pieceIndex = Math.floor((360 - normalizedDeg) / 60) % 6;
      setFinalMenu(menuData.menus[pieceIndex]);
    }, 4000);
  };

  const goToRestaurantMap = () => {
    if (!finalMenu) return;
    router.push(`/restaurant-map?menu=${encodeURIComponent(finalMenu)}`);
  };

  // --- 스타일 헬퍼 ---
  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  const getRankBadge = (rank: string) => {
    if (rank === '1등') return 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg';
    if (rank === '2등') return 'bg-orange-500 text-white shadow-orange-500/50 shadow-md';
    if (rank === '3등') return 'bg-yellow-400 text-black shadow-yellow-400/50 shadow-md';
    if (rank === '4등') return 'bg-blue-500 text-white shadow-blue-500/50 shadow-md';
    if (rank === '5등') return 'bg-green-500 text-white shadow-green-500/50 shadow-md';
    return 'bg-slate-700 text-slate-400 border border-slate-600';
  };

  const getMatchStyle = (myNum: number) => {
    if (!boardWinning) return "";
    const winNums = [boardWinning.num1, boardWinning.num2, boardWinning.num3, boardWinning.num4, boardWinning.num5, boardWinning.num6];
    if (winNums.includes(myNum)) return "ring-2 ring-emerald-400 scale-110";
    if (boardWinning.bonus === myNum) return "ring-2 ring-yellow-400 scale-110";
    return "opacity-40 grayscale-[0.5]";
  };

  const getMatchBadge = (myNum: number) => {
    if (!boardWinning) return null;
    const winNums = [boardWinning.num1, boardWinning.num2, boardWinning.num3, boardWinning.num4, boardWinning.num5, boardWinning.num6];
    if (winNums.includes(myNum)) return <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-900 shadow-sm z-20">✓</span>;
    if (boardWinning.bonus === myNum) return <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-900 shadow-sm z-20">B</span>;
    return null;
  };

  return (
    <div className="flex flex-col items-center min-h-screen text-white p-4 font-sans bg-gray-900">
      
      {/* 배너 섹션 */}
      <div className="w-full mb-8 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 group max-w-2xl">
        <div className="relative w-full aspect-[2/1] md:aspect-[3/1]">
           <Image 
              src="/hero-banner.jpg" 
              alt="MURRO LABS AI Research" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent">
             <div className="absolute bottom-4 left-6">
                <h1 className="text-2xl font-bold text-white drop-shadow-md">MURRO LABS</h1>
                <p className="text-xs text-slate-300">데이터와 AI로 일상의 행운을 실험하다</p>
             </div>
           </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🧪 섹션 1: 머로 연구소 (로또 / 운세 / 메뉴 탭 기능 복원) */}
      {/* ======================================================== */}
      
      <div className="w-full max-w-2xl mb-12">
        <div className="flex items-center mb-4 px-2">
            <span className="text-2xl mr-2">🧬</span>
            <h2 className="text-xl font-bold text-slate-200">머로 연구소</h2>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex w-full bg-slate-800 p-1 rounded-2xl mb-6 shadow-lg border border-slate-700">
          {[
            { id: 'lotto', label: '🎲 로또 분석' },
            { id: 'fortune', label: '🔮 운세' },
            { id: 'menu', label: '🍽️ 메뉴' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full min-h-[500px]">
          {/* 탭 1: 로또 */}
          {activeTab === 'lotto' && (
            <div className="animate-fade-in space-y-6">
              <div className="p-6 border border-slate-700 rounded-3xl bg-slate-800/50 backdrop-blur-sm shadow-xl">
                {lotto ? (
                  <div className="text-center">
                    <div className="inline-block bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-mono mb-3 border border-blue-800">LATEST DRAW</div>
                    <h2 className="text-3xl font-bold mb-1 font-mono">{lotto.turn}회 결과</h2>
                    <p className="text-slate-400 text-xs mb-6 font-mono">{lotto.draw_date}</p>
                    <div className="flex justify-center items-center gap-1 md:gap-2 flex-nowrap overflow-x-auto no-scrollbar pb-2">
                      {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((num, i) => (
                        <div key={i} className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-white font-bold text-sm md:text-xl shadow-lg border-b-4 flex-shrink-0 ${getBallColor(num)}`}>{num}</div>
                      ))}
                      <span className="text-slate-500 font-bold mx-1 flex-shrink-0">+</span>
                      <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-white font-bold text-sm md:text-xl shadow-lg border-b-4 flex-shrink-0 ${getBallColor(lotto.bonus)}`}>{lotto.bonus}</div>
                    </div>
                  </div>
                ) : (<div className="text-center py-8 text-slate-500 font-mono animate-pulse">데이터 로딩중...</div>)}
              </div>

              <button onClick={fetchPrediction} disabled={loading} className={`w-full py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all border border-blue-500/30 ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:scale-[1.02]'}`}>
                {loading ? "AI 분석중... 🧬" : `✨ ${currentTurn > 0 ? currentTurn : '다음'}회차 번호 생성`}
              </button>

              {prediction.length > 0 && (
                <div className="space-y-4 animate-fade-in-up">
                  {prediction.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-700 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-slate-300 text-lg font-mono">{String.fromCharCode(65 + index)}</span>
                        <div className="flex gap-2">
                          {game.map((num, i) => (<div key={i} className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-lg shadow-md border-b-4 ${getBallColor(num)}`}>{num}</div>))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleRegisterAll} className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg transform transition-transform active:scale-95 border border-emerald-500/30">
                    🏆 명예의 전당 등록
                  </button>
                </div>
              )}
              
              <div className="p-6 bg-slate-800/80 rounded-3xl border border-slate-700 backdrop-blur-md">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">🏆 명예의 전당</h3>
                  <select value={boardTurn} onChange={handleTurnChange} className="bg-slate-700 text-white px-3 py-1 rounded-lg border border-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {currentTurn > 0 && Array.from({length: 5}, (_, i) => currentTurn - i).map(t => (
                      <option key={t} value={t}>
                          {t}회 {t === currentTurn ? "(진행중)" : t === currentTurn - 1 ? "(최신결과)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-center text-sm relative">
                    <thead className="sticky top-0 bg-slate-800 z-10"> 
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="pb-3 pt-2">닉네임</th><th className="pb-3 pt-2">선택 번호</th><th className="pb-3 pt-2">결과</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {hallOfFame.length === 0 ? (
                        <tr><td colSpan={3} className="py-8 text-slate-500">등록된 데이터가 없습니다.</td></tr>
                      ) : (
                        hallOfFame.map((item) => (
                          <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className="py-3 text-slate-300 font-sans">{item.username}</td>
                            <td className="py-3">
                              <div className="flex justify-center gap-1 md:gap-3">
                                {[item.p_num1, item.p_num2, item.p_num3, item.p_num4, item.p_num5, item.p_num6].map((n, idx) => (
                                  <div key={idx} className="relative inline-block">
                                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs text-white font-bold shadow border-b-2 ${getBallColor(n)} ${getMatchStyle(n)}`}>
                                          {n}
                                      </span>
                                      {getMatchBadge(n)}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3"><span className={`px-2 py-1 rounded-md text-[10px] font-bold font-sans ${getRankBadge(item.rank)}`}>{item.rank}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-700">
                 <Link href="/map" className="flex-1">
                   <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors shadow-lg cursor-pointer h-32 justify-center group">
                      <span className="text-3xl group-hover:scale-110 transition-transform">🗺️</span>
                      <span className="font-bold text-sm text-emerald-400">명당 지도</span>
                   </div>
                 </Link>
                 <Link href="/ranking" className="flex-1">
                   <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors shadow-lg cursor-pointer h-32 justify-center group">
                      <span className="text-3xl group-hover:scale-110 transition-transform">🏆</span>
                      <span className="font-bold text-sm text-yellow-400">명예의 전당</span>
                   </div>
                 </Link>
              </div>
            </div>
          )}

          {/* 탭 2: 운세 */}
          {activeTab === 'fortune' && (
            <div className="animate-fade-in flex flex-col items-center">
              {!fortuneData && (
                <div className="w-full bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl mb-6">
                  <h2 className="text-xl font-bold mb-6 text-center text-slate-200">🔮 오늘의 운세 분석</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-slate-400 mb-2 text-xs font-mono">생년월일</label>
                        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none text-sm font-mono [color-scheme:dark]"/>
                      </div>
                      <div className="flex-1">
                        <label className="block text-slate-400 mb-2 text-xs font-mono">태어난 시간</label>
                        <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none text-sm font-mono [color-scheme:dark]"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-xs font-mono">성별</label>
                      <div className="flex gap-4">
                        {['남성', '여성'].map((g) => (
                          <label key={g} className={`flex-1 p-3 rounded-xl border cursor-pointer text-center transition-all text-sm font-bold ${gender === g ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400'}`}>
                            <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} className="hidden"/>{g}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button onClick={fetchFortune} disabled={fortuneLoading} className={`w-full py-4 mt-4 rounded-xl font-bold text-sm shadow-lg transition-all border border-purple-500/30 ${fortuneLoading ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.02]'}`}>
                      {fortuneLoading ? "분석 중... 🧘‍♂️" : "운세 데이터 분석 시작"}
                    </button>
                  </div>
                </div>
              )}
              {fortuneData && (
                <div className="w-full animate-fade-in-up">
                  <div className="bg-slate-800 border border-purple-500/50 rounded-3xl p-6 shadow-2xl mb-8">
                    <div className="text-center mb-6 border-b border-slate-700 pb-4">
                      <div className="text-4xl mb-2">{fortuneData.wealth_luck}</div>
                      <h3 className="text-xl font-bold text-purple-300 font-mono">종합 점수: {fortuneData.total_score}</h3>
                      <p className="text-slate-400 text-xs mt-1 font-mono">행운의 색: <span className="text-white">{fortuneData.lucky_color}</span></p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl mb-6 border border-slate-700">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{fortuneData.comment}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-3 font-mono">행운의 숫자</p>
                      <div className="flex justify-center gap-2">
                        {fortuneData.lucky_numbers.map((num, i) => (
                          <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-md border-b-4 ${getBallColor(num)}`}>{num}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                     <button onClick={() => setFortuneData(null)} className="text-slate-500 hover:text-white underline text-xs font-mono">다시 분석하기</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 탭 3: 메뉴 */}
          {activeTab === 'menu' && (
            <div className="w-full flex flex-col items-center animate-fade-in">
              {!menuData ? (
                 <div className="w-full max-w-md text-center py-10 bg-slate-800/50 rounded-3xl border border-slate-700 mx-auto">
                   <div className="text-6xl mb-4 grayscale opacity-50">🍽️</div>
                   <h2 className="text-xl font-bold text-slate-200 mb-2">오늘의 메뉴 추천</h2>
                   <p className="text-slate-400 mb-8 text-sm">위치, 날씨, 시간 데이터를 분석하여<br/>최적의 메뉴를 제안합니다.</p>
                   <button onClick={fetchMenus} disabled={loading} className="w-3/4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:scale-105 transition-transform border border-orange-500/30">
                     {loading ? "분석 중..." : "메뉴 추천 시작"}
                   </button>
                 </div>
              ) : (
                <div className="w-full max-w-md flex flex-col items-center mx-auto">
                  <div className="bg-slate-800 p-4 rounded-2xl mb-6 text-center border border-orange-500/30 w-full shadow-lg">
                    <p className="text-orange-400 font-bold mb-1 text-xs">AI 추천 코멘트</p>
                    <p className="text-slate-300 text-sm leading-relaxed">"{menuData.reason}"</p>
                  </div>
                  <div className="relative w-72 h-72 mb-8">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-8 h-10 text-red-500 drop-shadow-lg text-4xl">▼</div>
                    <div ref={wheelRef} className="w-full h-full rounded-full border-4 border-slate-200 overflow-hidden relative shadow-2xl bg-slate-700" style={{ transition: 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
                      {menuData.menus.map((menu, i) => (
                        <div key={i} className="absolute w-full h-full top-0 left-0" style={{ transform: `rotate(${i * 60 + 30}deg)`, transformOrigin: '50% 50%' }}>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 flex justify-center pt-6">
                            <span className="text-white font-bold text-sm drop-shadow-md whitespace-nowrap writing-vertical-rl font-mono">{menu}</span>
                          </div>
                          <div className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-white/20 -translate-x-1/2 origin-bottom" style={{ transform: `rotate(-30deg)`, transformOrigin: 'bottom center' }}></div>
                        </div>
                      ))}
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"></div>
                    </div>
                  </div>
                  {!finalMenu ? (
                    <button onClick={spinWheel} disabled={isSpinning} className="px-10 py-3 rounded-full font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg animate-bounce border border-indigo-400">
                      {isSpinning ? "SPINNING..." : "돌림판 돌리기"}
                    </button>
                  ) : (
                    <div className="text-center animate-fade-in-up w-full">
                      <p className="text-slate-400 mb-1 text-xs">최적의 선택</p>
                      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6">{finalMenu}</h2>
                      <div className="flex gap-3 justify-center">
                        <button onClick={fetchMenus} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs hover:bg-slate-600">다시 추천</button>
                        <button onClick={goToRestaurantMap} className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg hover:bg-emerald-500 flex items-center gap-2 border border-emerald-500/30">
                          🗺️ 식당 찾기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🎡 섹션 2: 머로 놀이터 (신규 기능 추가 공간) */}
      {/* ======================================================== */}
      
      <div className="w-full max-w-2xl mb-12">
        <div className="flex items-center mb-4 px-2">
            <span className="text-2xl mr-2">🎡</span>
            <h2 className="text-xl font-bold text-slate-200">머로 놀이터</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
           {/* 카드 1: 무한 밸런스 게임 (NEW) */}
           <Link href="/balance" className="group block bg-slate-800 rounded-3xl shadow-lg hover:shadow-xl transition-all border border-slate-700 overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">NEW</div>
              <div className="p-6 flex items-center gap-6">
                <div className="w-16 h-16 bg-red-900/30 rounded-2xl flex items-center justify-center text-3xl border border-red-500/20 group-hover:scale-110 transition-transform">
                  ⚖️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">무한 밸런스 게임</h3>
                  <p className="text-sm text-slate-400">끝없는 난제! 당신의 선택과 다른 사람들의 생각을 비교해보세요.</p>
                </div>
                <div className="ml-auto text-slate-500 group-hover:translate-x-1 transition-transform">
                  ➜
                </div>
              </div>
            </Link>
        </div>
      </div>

    </div>
  );
}