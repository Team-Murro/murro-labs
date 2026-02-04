from fastapi import APIRouter
from pydantic import BaseModel
import requests
import json
# weather.py에서 get_weather 함수 가져오기 (파일이 같은 폴더에 있어야 함)
from .weather import get_weather 

router = APIRouter()

@router.get("/menu/recommend")
async def recommend_menu(lat: float, lng: float):
    # 1. 날씨 가져오기
    weather_info = get_weather(lat, lng) # { "condition": "Clear", "temp": 20.5 }
    current_weather = weather_info.get("condition", "Unknown")
    current_temp = weather_info.get("temp", "Unknown")

    # [수정] 프롬프트 대폭 수정: 헷갈리는 예시 삭제하고 조건 강화
    prompt = f"""
    당신은 점심 메뉴 추천 전문가입니다.
    
    [현재 상황]
    - 날씨: {current_weather} (이 날씨에 맞는 음식만 추천할 것)
    - 기온: {current_temp}도
    
    [지시사항]
    1. 날씨가 'Rain'이나 'Drizzle'이면 따뜻한 국물이나 전을 추천하세요.
    2. 날씨가 'Clear'나 'Sunny'라면 절대로 비 오는 날 음식을 언급하지 말고, 깔끔한 음식을 추천하세요.
    3. 앞뒤 문맥이 모순되지 않게 하나의 추천 이유만 말하세요.
    
    [출력 형식 - JSON Only]
    {{
        "menu_name": "음식 이름",
        "reason": "추천 이유 (한 문장으로 짧게, 날씨를 반영해서)"
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3", 
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        result = response.json()
        return json.loads(result['response'])
    except Exception as e:
        print(f"Menu Error: {e}")
        # 에러 시 기본값
        return {"menu_name": "제육볶음", "reason": "인공지능도 고민하다가 결국 제육을 골랐습니다."}