import requests
import json
import os
from weather import get_kma_weather

# [유지] K3s 환경 대응
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

async def get_menu_recommendation(lat: float, lng: float, now_str: str):
    weather_data = get_kma_weather(lat, lng)
    
    condition_desc = "알 수 없음"
    temp = "모름"
    
    if weather_data:
        try:
            pty = int(weather_data.get('PTY', 0))
            if pty == 0: condition_desc = "맑음 (비 안 옴)"
            elif pty in [1, 2, 4]: condition_desc = "비"
            elif pty == 3: condition_desc = "눈"
            temp = weather_data.get('T1H', '모름')
        except:
            pass
            
    prompt = f"""
    당신은 메뉴 추천 전문가입니다.
    
    [현재 환경]
    - 시간: {now_str}
    - 날씨: {condition_desc} 
    - 기온: {temp}도
    
    [규칙]
    1. 날씨가 '비'나 '눈'일 때만 전, 국물 요리를 추천하세요. '맑음'이면 깔끔한 음식을 추천하세요.
    2. 추천 메뉴는 딱 하나만 선정하고, 이유를 한 문장으로 설명하세요.
    
    [출력 형식 - JSON Only]
    {{
        "menu_name": "음식 이름 (한글)",
        "reason": "추천 이유 (한 문장)"
    }}
    """

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False
            },
            timeout=30
        )
        result_json = response.json()
        return json.loads(result_json['response'])
        
    except Exception as e:
        print(f"Menu Error ({OLLAMA_HOST}): {e}")
        return {"menu_name": "된장찌개", "reason": "AI 연결이 지연되어 가장 무난한 메뉴를 추천합니다."}