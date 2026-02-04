'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// [복구 완료] 회원님의 기존 키를 다시 넣었습니다. 이대로 바로 실행됩니다.
const KAKAO_JS_KEY = "9cc09fdfe6ab741a49587a4afcccf613";

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const menu = searchParams.get('menu');
  const [map, setMap] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 키가 없으면 실행 중단 (안전장치)
    if (!KAKAO_JS_KEY) return;

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          if (mapContainerRef.current) {
            const options = { center: new window.kakao.maps.LatLng(lat, lng), level: 3 };
            const mapInstance = new window.kakao.maps.Map(mapContainerRef.current, options);
            setMap(mapInstance);
            
            // 지도 로드 후 바로 검색
            if (menu) {
               setTimeout(() => searchPlaces(mapInstance, menu), 500);
            }
          }
        });
      });
    };
  }, [menu]);

  const searchPlaces = (currentMap: any, keyword: string) => {
    if (!currentMap || !keyword) return;
    setLoading(true);
    
    const ps = new window.kakao.maps.services.Places();
    const center = currentMap.getCenter();
    
    const options = {
      location: center,
      radius: 1500, // 1.5km 반경
      sort: window.kakao.maps.services.SortBy.DISTANCE,
    };

    ps.keywordSearch(keyword, (data: any, status: any) => {
      setLoading(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(data);
        displayMarkers(currentMap, data);
      } else {
        setPlaces([]);
      }
    }, options);
  };

  const displayMarkers = (currentMap: any, places: any[]) => {
    const bounds = new window.kakao.maps.LatLngBounds();

    places.forEach((place) => {
      const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });
      marker.setMap(currentMap);
      
      window.kakao.maps.event.addListener(marker, 'click', () => {
        window.open(place.place_url, '_blank');
      });
      bounds.extend(markerPosition);
    });
    
    if (places.length > 0) {
      currentMap.setBounds(bounds);
    }
  };

  const handleReSearch = () => {
    if (map && menu) searchPlaces(map, menu);
  };

  return (
    // 모바일 브라우저 주소창 대응 (100dvh)
    <div className="flex flex-col w-full h-[100dvh] bg-slate-900 overflow-hidden relative">
      
      {/* 1. 상단 헤더 */}
      <header className="absolute top-0 left-0 right-0 z-50 h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex justify-between items-center px-4">
         <button onClick={() => router.back()} className="text-slate-400 font-bold p-2">←</button>
         <h1 className="text-lg font-bold text-white truncate">{menu ? `${menu} 맛집` : '주변 식당'}</h1>
         <div className="w-8"></div>
      </header>

      {/* 2. 지도 영역 (화면의 65% 고정) */}
      <div className="w-full h-[65%] relative pt-14">
        <div ref={mapContainerRef} className="w-full h-full bg-slate-800"></div>
        
        {/* 현 위치에서 검색 버튼 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-max">
          <button 
            onClick={handleReSearch}
            className="bg-white text-slate-900 px-5 py-2.5 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 border border-slate-200 active:scale-95 transition-transform"
          >
            <span>🔄</span> 현 위치에서 다시 검색
          </button>
        </div>
      </div>

      {/* 3. 리스트 영역 (화면의 35% 고정 - 무조건 보임) */}
      <div className="w-full h-[35%] bg-slate-800 border-t border-slate-700 flex flex-col z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800 shrink-0">
           <span className="text-sm font-bold text-slate-200">검색 결과 <span className="text-orange-400">{places.length}</span>건</span>
           {loading && <span className="text-xs text-orange-400 animate-pulse font-bold">찾는 중...</span>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 pb-8 bg-slate-900/50">
           {places.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
               <span className="text-3xl">🍃</span>
               <span className="text-xs text-center">지도를 움직여<br/>다시 검색 버튼을 눌러보세요!</span>
             </div>
           ) : (
             places.map((place, i) => (
               <div 
                 key={i} 
                 className="mb-2 p-3 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center active:bg-slate-700 transition-colors cursor-pointer" 
                 onClick={() => window.open(place.place_url)}
               >
                 <div className="overflow-hidden pr-3">
                   <h3 className="text-sm font-bold text-white truncate">{place.place_name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{place.road_address_name || place.address_name}</span>
                     {place.category_name && (
                       <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                         {place.category_name.split('>').pop()?.trim()}
                       </span>
                     )}
                   </div>
                 </div>
                 <span className="text-xs font-bold text-orange-400 whitespace-nowrap">{place.phone || "번호없음"}</span>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantMapPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-white bg-slate-900">지도 로딩 중...</div>}>
      <MapContent />
    </Suspense>
  );
}