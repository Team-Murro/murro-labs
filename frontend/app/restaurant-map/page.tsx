'use client';

import { useState, useRef, Suspense } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    kakao: any;
  }
}

function RestaurantMapContent() {
  const searchParams = useSearchParams();
  const menuName = searchParams.get('menu');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [status, setStatus] = useState("지도를 불러오는 중...");
  const [isMapDragged, setIsMapDragged] = useState(false);
  
  const [isSheetOpen, setIsSheetOpen] = useState(true);

  const currentInfowindow = useRef<any>(null);
  const KAKAO_MAP_KEY = "9cc09fdfe6ab741a49587a4afcccf613"; 

  const initializeMap = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current) return;

        const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.9780);
        const options = { center: defaultCenter, level: 4 };
        const newMap = new window.kakao.maps.Map(mapContainerRef.current, options);
        setMap(newMap);
        
        window.kakao.maps.event.addListener(newMap, 'click', function() {
            if (currentInfowindow.current) {
                currentInfowindow.current.close();
                currentInfowindow.current = null;
            }
        });

        window.kakao.maps.event.addListener(newMap, 'dragend', () => {
            setIsMapDragged(true);
        });
        
        setStatus("내 위치를 찾는 중입니다...");
        findLocationAndSearch(newMap);
      });
    }
  };

  const findLocationAndSearch = (currentMap: any) => {
    if (!navigator.geolocation) {
      setStatus("위치 기능을 사용할 수 없어 기본 위치에서 검색합니다.");
      searchPlaces(currentMap, currentMap.getCenter());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const myPosition = new window.kakao.maps.LatLng(lat, lng);

        currentMap.setCenter(myPosition);
        
        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
        const imageSize = new window.kakao.maps.Size(24, 35); 
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);
        
        new window.kakao.maps.Marker({
          position: myPosition,
          map: currentMap,
          title: "내 위치",
          image: markerImage
        });

        searchPlaces(currentMap, myPosition);
      },
      (err) => {
        console.error(err);
        setStatus("위치를 찾을 수 없어 기본 위치에서 검색합니다.");
        searchPlaces(currentMap, currentMap.getCenter());
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
    );
  };

  const searchPlaces = (currentMap: any, location: any) => {
    if (menuName && (!window.kakao.maps.services)) {
        setStatus("⚠️ 지도가 완전히 로드되지 않았습니다. 새로고침 해주세요!");
        return;
    }
    if (!menuName) return;

    setStatus(`'${menuName}' 맛집 검색 중...`);
    setIsMapDragged(false);

    const ps = new window.kakao.maps.services.Places();
    
    ps.keywordSearch(menuName, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(data);
        setStatus(`'${menuName}' 맛집 ${data.length}곳을 찾았습니다.`);
        setIsSheetOpen(true);
        
        const bounds = new window.kakao.maps.LatLngBounds();
        if (location) bounds.extend(location);

        data.forEach((place: any) => {
          const placePos = new window.kakao.maps.LatLng(place.y, place.x);
          const marker = new window.kakao.maps.Marker({
            position: placePos,
            map: currentMap
          });

          const iwContent = `
            <div style="padding:10px; color:#333; font-size:12px; width:180px; background:white; border-radius:5px; box-shadow:0 1px 3px rgba(0,0,0,0.2);">
              <div style="font-weight:bold; margin-bottom:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${place.place_name}</div>
              <div style="color:gray; margin-bottom:5px;">${place.phone || '전화번호 없음'}</div>
              <a href="${place.place_url}" target="_blank" style="color:blue; text-decoration:none; font-weight:bold;">👉 상세정보 보기</a>
            </div>
          `;
          
          const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            if (currentInfowindow.current) currentInfowindow.current.close();
            infowindow.open(currentMap, marker);
            currentInfowindow.current = infowindow;
          });

          bounds.extend(placePos);
        });
        currentMap.setBounds(bounds);
      } else {
        setStatus(`이 근처엔 '${menuName}' 식당이 없네요 😅`);
        setPlaces([]);
      }
    }, {
      location: location,
      radius: 2000,
      sort: window.kakao.maps.services.SortBy.DISTANCE
    });
  };

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onReady={initializeMap}
      />
      
      {/* [수정] top-[70px] -> top-24 (96px) : 확실하게 헤더 아래로 이동 */}
      <div className="absolute top-24 left-4 z-20 flex gap-2 items-center">
         <Link href="/" className="bg-gray-900/90 text-white px-4 py-2 rounded-full font-bold shadow-lg border border-gray-600 hover:bg-gray-800 transition-all text-sm">
          ← 홈
        </Link>
        <div className="bg-orange-600/90 text-white px-4 py-2 rounded-full font-bold shadow-lg text-sm flex items-center">
           🍽️ {menuName}
        </div>
      </div>

      {/* [수정] top-40 -> top-44 : 버튼도 같이 내림 */}
      {isMapDragged && map && (
        <button 
            onClick={() => searchPlaces(map, map.getCenter())}
            className="absolute top-44 left-1/2 transform -translate-x-1/2 z-20 bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl font-bold animate-bounce text-sm flex items-center gap-2 border border-blue-400"
        >
            🔄 이 위치에서 재검색
        </button>
      )}

      <div 
        className={`absolute bottom-0 left-0 w-full bg-gray-900/95 z-30 rounded-t-3xl border-t border-gray-700 flex flex-col shadow-2xl transition-all duration-300 ease-in-out safe-area-pb ${
          isSheetOpen ? 'h-[40vh]' : 'h-14'
        }`}
      >
        <div 
          onClick={() => setIsSheetOpen(!isSheetOpen)}
          className="p-3 text-center border-b border-gray-700 bg-gray-800/80 rounded-t-3xl sticky top-0 backdrop-blur-md cursor-pointer hover:bg-gray-800 transition-colors flex flex-col items-center justify-center h-14 shrink-0"
        >
            <div className="w-12 h-1 bg-gray-500 rounded-full mb-1"></div>
            {!isSheetOpen && (
              <span className="text-xs text-gray-400 font-bold animate-pulse">목록 보기 ({places.length}개)</span>
            )}
            {isSheetOpen && (
              <h3 className="text-white font-bold text-sm truncate w-full px-4">{status}</h3>
            )}
        </div>

        <div className="overflow-y-auto p-4 space-y-3 pb-8 flex-1">
          {places.length === 0 && (
             <div className="text-center text-gray-500 py-10 text-sm">
                지도를 움직여서<br/>[이 위치에서 재검색] 버튼을 눌러보세요!
             </div>
          )}
          {places.map((place, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex justify-between items-center hover:bg-gray-700 transition-colors">
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-white font-bold truncate text-sm">{place.place_name}</div>
                <div className="text-gray-400 text-xs truncate mt-0.5">{place.road_address_name || place.address_name}</div>
                <div className="text-orange-400 text-xs mt-0.5">{place.phone}</div>
              </div>
              <a href={place.place_url} target="_blank" className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-500 whitespace-nowrap font-bold">
                상세
              </a>
            </div>
          ))}
        </div>
      </div>

      <div 
        ref={mapContainerRef} 
        id="map" 
        className="w-full h-[100dvh] bg-gray-900"
      >
        {!map && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                지도를 불러오는 중...
            </div>
        )}
      </div>
    </>
  );
}

export default function RestaurantMapPage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-10">로딩중...</div>}>
      <RestaurantMapContent />
    </Suspense>
  );
}
