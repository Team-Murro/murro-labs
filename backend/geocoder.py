# backend/geocoder.py
import requests
import time
from sqlalchemy.orm import Session
from database import SessionLocal
from models import WinningStore

# --- 설정 ---
KAKAO_API_KEY = "e624c4d7b64f667821aa5c0f411361ad"
HEADERS = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}

def get_coordinates(address):
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    params = {"query": address}
    
    try:
        response = requests.get(url, headers=HEADERS, params=params)
        if response.status_code == 200:
            result = response.json()
            documents = result.get('documents')
            if documents:
                # 첫 번째 검색 결과의 좌표 반환 (y: 위도, x: 경도)
                return documents[0]['y'], documents[0]['x']
    except Exception as e:
        print(f"API 요청 에러: {e}")
    
    return None, None

def update_store_coordinates():
    db: Session = SessionLocal()

    # lat이 NULL인 것만 조회 (0.0은 조회 안 됨)
    target_stores = db.query(WinningStore).filter(WinningStore.lat == None).all()
    
    total = len(target_stores)
    print(f"🕵️‍♂️ 좌표 변환 대상: 총 {total}개 매장")
    
    success_count = 0
    fail_count = 0
    
    for i, store in enumerate(target_stores):
        lat, lng = get_coordinates(store.address)
        
        if lat and lng:
            store.lat = lat
            store.lng = lng
            success_count += 1
        else:
            # [중요] 실패 시에도 DB를 업데이트하여 다음 번 조회 대상에서 제외
            store.lat = 0.0  
            store.lng = 0.0
            fail_count += 1
            print(f"[{i+1}/{total}] ? 실패 (Skip 처리): {store.store_name}")    
        
        # 100건마다 커밋 (너무 자주 커밋하면 느려짐)
        if (i + 1) % 100 == 0:
            db.commit()
            
        # API 과부하 방지를 위한 아주 짧은 대기 (선택 사항)
        # time.sleep(0.05) 

    db.commit() # 남은 데이터 최종 저장
    db.close()
    
    print("\n🎉 작업 완료!")
    print(f"성공: {success_count}건, 실패: {fail_count}건")

if __name__ == "__main__":
    update_store_coordinates()
