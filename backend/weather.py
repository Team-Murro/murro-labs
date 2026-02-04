import requests
import json
import os
import random
from datetime import datetime, timedelta, timezone
import math

# [설정]
KMA_SERVICE_KEY = "5O8amH3CuB7GG9Sao7CcPmOYOwtouzgmUr/GSZMR66S/a+m77PktiMeVaixQb1FMZhVgm2+cXdn8twiV1lmxzA==" 
KAKAO_API_KEY = "e624c4d7b64f667821aa5c0f411361ad"
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

# --- 1. 주소 조회 ---
def get_current_address(lat, lng):
    url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"x": lng, "y": lat}
    
    try:
        res = requests.get(url, headers=headers, params=params, timeout=3)
        if res.status_code == 200:
            data = res.json()
            if data.get('documents'):
                doc = data['documents'][0]
                for d in data['documents']:
                    if d['region_type'] == 'H':
                        doc = d
                        break
                return f"{doc['region_1depth_name']} {doc['region_2depth_name']} {doc['region_3depth_name']}"
    except Exception as e:
        print(f"Address API Error: {e}")
    return "위치 정보 없음"

# --- 2. 기상청 조회 ---
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
    
    kst_timezone = timezone(timedelta(hours=9))
    current_kst = datetime.now(kst_timezone)
    
    for i in range(3):
        try:
            target_time = current_kst - timedelta(minutes=45 + (i*60))
            base_date = target_time.strftime("%Y%m%d")
            base_time = target_time.strftime("%H00")
            
            params = {
                "serviceKey": KMA_SERVICE_KEY,
                "base_date": base_date, "base_time": base_time,
                "nx": nx, "ny": ny, "dataType": "JSON", "numOfRows": 10
            }
            res = requests.get(url, params=params, timeout=15)
            if res.status_code == 200:
                data = res.json()
                if data.get('response', {}).get('header', {}).get('resultCode') == '00':
                    items = data['response']['body']['items']['item']
                    return {item['category']: item['obsrValue'] for item in items}
        except:
            continue
    return None

# --- [수정] 3. LLM 멘트 생성 (논리 강화) ---
def get_weather_comment(address, temp, condition, wind):
    """
    날씨 데이터를 바탕으로 '말이 되는' 한 줄 멘트를 생성합니다.
    """
    prompt = f"""
    Context:
    - Location: {address}
    - Weather: {condition} (If '맑음', it implies sunny/clear sky.)
    - Temperature: {temp}°C
    - Wind: {wind}m/s
    
    Task:
    Write a short, helpful, and sensible one-sentence weather briefing in Korean.
    
    [CRITICAL LOGIC RULES]:
    1. If Weather is '맑음' (Clear): DO NOT mention umbrellas. Suggest light activities or enjoy the sun.
    2. If Weather is '비' (Rain) or '소나기': MUST mention 'umbrella'.
    3. If Weather is '눈' (Snow): Mention 'umbrella' or 'slippery roads'.
    4. If Wind > 9m/s: Mention 'strong wind'.
    5. The advice MUST strictly match the provided Weather condition. Do NOT make jokes that contradict the weather.

    Tone: Warm, caring, sensible friend.
    
    Example Output JSON:
    {{ "comment": "햇살이 참 좋은 날이에요! 잠깐 산책하며 기분 전환해보세요. ☀️" }}
    """
    
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": 0.6, # [수정] 0.8 -> 0.6 (안정성 강화)
                    "top_p": 0.9
                }
            },
            timeout=5
        )
        
        result = response.json()
        data = json.loads(result['response'])
        
        # [안전장치] 만약 멘트가 비어서 오면 기본값 사용
        comment = data.get('comment', '')
        if not comment:
             return f"{address}의 현재 날씨는 {condition}, 기온은 {temp}도입니다."
        return comment
        
    except Exception as e:
        print(f"Weather LLM Error: {e}")
        # 에러 시 기본 멘트
        return f"{address}의 현재 날씨는 {condition}, 기온은 {temp}도입니다."