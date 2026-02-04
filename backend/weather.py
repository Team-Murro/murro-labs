import requests
from datetime import datetime, timedelta, timezone
import math

# [설정] 공공데이터포털 키
KMA_SERVICE_KEY = "5O8amH3CuB7GG9Sao7CcPmOYOwtouzgmUr/GSZMR66S/a+m77PktiMeVaixQb1FMZhVgm2+cXdn8twiV1lmxzA==" 
# [추가] 카카오 API 키 (geocoder.py의 키 재사용)
KAKAO_API_KEY = "e624c4d7b64f667821aa5c0f411361ad"

def get_current_address(lat, lng):
    """
    좌표(lat, lng)를 받아 '서울 강남구 역삼동' 형태의 주소 문자열 반환
    """
    url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"x": lng, "y": lat} # 카카오는 x가 경도(lng), y가 위도(lat)
    
    try:
        res = requests.get(url, headers=headers, params=params, timeout=3)
        if res.status_code == 200:
            data = res.json()
            if data.get('documents'):
                # 행정동(H)을 우선 사용하고, 없으면 법정동(B) 사용
                doc = data['documents'][0]
                for d in data['documents']:
                    if d['region_type'] == 'H':
                        doc = d
                        break
                return f"{doc['region_1depth_name']} {doc['region_2depth_name']} {doc['region_3depth_name']}"
    except Exception as e:
        print(f"Address API Error: {e}")
        
    return "위치 정보 없음"

def convert_to_grid(lat, lng):
    RE = 6371.00877
    GRID = 5.0
    SLAT1 = 30.0 * math.pi / 180.0
    SLAT2 = 60.0 * math.pi / 180.0
    OLON = 126.0 * math.pi / 180.0
    OLAT = 38.0 * math.pi / 180.0
    XO, YO = 43, 136

    DEGRAD = math.pi / 180.0
    re = RE / GRID
    slat1 = SLAT1
    slat2 = SLAT2
    olon = OLON
    olat = OLAT

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)
    ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
    ra = re * sf / math.pow(ra, sn)
    theta = lng * DEGRAD - olon
    if theta > math.pi: theta -= 2.0 * math.pi
    if theta < -math.pi: theta += 2.0 * math.pi
    theta *= sn
    nx = math.floor(ra * math.sin(theta) + XO + 0.5)
    ny = math.floor(ro - ra * math.cos(theta) + YO + 0.5)
    return nx, ny

def get_kma_weather(lat, lng):
    nx, ny = convert_to_grid(lat, lng)
    url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
    
    # [수정] 서버 시간이 UTC여도 무조건 한국 시간(KST)으로 계산
    kst_timezone = timezone(timedelta(hours=9))
    current_kst = datetime.now(kst_timezone)
    
    for i in range(3):
        try:
            target_time = current_kst - timedelta(minutes=45 + (i*60))
            base_date = target_time.strftime("%Y%m%d")
            base_time = target_time.strftime("%H00")

            params = {
                "serviceKey": KMA_SERVICE_KEY,
                "base_date": base_date,
                "base_time": base_time,
                "nx": nx, "ny": ny,
                "dataType": "JSON", 
                "numOfRows": 10
            }
            
            res = requests.get(url, params=params, timeout=15)
            
            if res.status_code == 200:
                data = res.json()
                if data.get('response', {}).get('header', {}).get('resultCode') == '00':
                    items = data['response']['body']['items']['item']
                    return {item['category']: item['obsrValue'] for item in items}
                    
        except Exception as e:
            print(f"Weather API retry {i+1} fail: {e}")
            continue
            
    return None