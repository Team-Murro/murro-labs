import requests
import json
from weather import get_weather

# main.py에서 (lat, lng, now_str) 3개를 넘겨줍니다.
async def get_menu_recommendation(lat: float, lng: float, now_str: str):
    # 1. 날씨 정보 가져오기
    weather_data = get_weather(lat, lng)
    condition = weather_data.get("condition", "Unknown") # Rain, Clear, Clouds 등
    temp = weather_data.get("temp", "Unknown")

    # [수정] 날씨가 맑은데 파전 추천하는 '환각' 방지용 프롬프트
    prompt = f"""
    당신은 점심/저녁 메뉴 추천 전문가입니다.
    
    [현재 환경]
    - 시간: {now_str}
    - 날씨 상태: {condition} 
    - 기온: {temp}도
    
    [규칙]
    1. 날씨가 'Rain', 'Drizzle', 'Thunderstorm'일 때만 전, 막걸리, 따뜻한 국물을 추천하세요.
    2. 날씨가 'Clear', 'Sunny', 'Clouds'라면 절대 비 관련 음식을 추천하지 마세요.
    3. 기온이 높으면 시원한 음식, 낮으면 따뜻한 음식을 추천하세요.
    
    [출력 형식 - JSON Only]
    {{
        "menu_name": "음식 이름 (한글)",
        "reason": "추천 이유 (날씨와 기온을 근거로 한 문장)"
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        result_json = response.json()
        return json.loads(result_json['response'])
        
    except Exception as e:
        print(f"Menu Error: {e}")
        return {"menu_name": "된장찌개", "reason": "AI가 메뉴를 고르지 못해 가장 무난한 한국인의 소울푸드를 추천합니다."}