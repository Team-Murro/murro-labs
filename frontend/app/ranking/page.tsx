'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TopStore {
  store_name: string;
  address: string;
  lat: number;
  lng: number;
  "1st": number;
  "2nd": number;
}

export default function RankingPage() {
  const [stores, setStores] = useState<TopStore[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_BASE = '';

  useEffect(() => {
    fetch(`${API_BASE}/api/stores/top`)
      .then(res => res.json())
      .then(data => {
        setStores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRowClick = (store: TopStore) => {
    router.push(`/map?lat=${store.lat}&lng=${store.lng}&name=${encodeURIComponent(store.store_name)}`);
  };

  return (
    <div className="min-h-screen p-4 font-sans text-slate-200">
      <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto mt-4">
        <Link href="/" className="bg-slate-800 px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-bold text-xs font-mono border border-slate-700">
          ← BACK
        </Link>
        <h1 className="text-xl md:text-2xl font-bold font-mono text-yellow-400">
          TOP 100 STORES
        </h1>
        <div className="w-16"></div>
      </div>

      <div className="max-w-4xl mx-auto bg-slate-800/50 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-20 text-center text-slate-500 animate-pulse font-mono text-sm">
            Loading Data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-slate-400 bg-slate-900/80 sticky top-0 z-10 text-xs font-mono uppercase">
                <tr>
                  <th className="px-4 py-4 text-center">Rank</th>
                  <th className="px-4 py-4">Store Info</th>
                  <th className="px-4 py-4 text-center text-red-400">1st Prize</th>
                  <th className="px-4 py-4 text-center text-blue-400">2nd Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {stores.map((store, index) => (
                  <tr 
                    key={index} 
                    onClick={() => handleRowClick(store)}
                    className="hover:bg-slate-700/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-4 text-center font-bold text-lg text-slate-500 group-hover:text-white font-mono">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-base text-slate-200 group-hover:text-yellow-300 transition-colors mb-1">
                        {store.store_name}
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-1 font-mono">
                        📍 {store.address}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block bg-red-900/20 text-red-400 border border-red-900/30 px-2 py-1 rounded font-mono font-bold text-xs">
                        {store["1st"]}회
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-400 font-mono text-xs">
                      {store["2nd"]}회
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
