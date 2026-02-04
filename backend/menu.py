# backend/menu.py
import ollama
import json
from datetime import datetime
from weather import get_kma_weather 

SYSTEM_PROMPT = """
당신은 20년 경력의 미식가이자 영양사입니다. 
사용자의 현재 시간, 날씨, 기온을 고려하여 식사 메뉴 6가지를 추천합니다.

[절대 원칙]
1. 메뉴 이름은 수식어를 뺀 '일반 명사'로만 출력하세요.
2. 결과는 반드시 아래 JSON 형식을 지키세요.
3. 'menus' 리스트의 6개 메뉴 중, 현재 날씨에 가장 베스트인 메뉴의 인덱스(0~5)를 'selected_index'에 명시하세요.

JSON 형식:
{
  "reason": "날씨 분석 텍스트",
  "menus": ["메뉴1", "메뉴2", "메뉴3", "메뉴4", "메뉴5", "메뉴6"],
  "selected_index": 0
}
"""

async def get_menu_recommendation(lat: float, lng: float, current_time: str):
    weather = get_kma_weather(lat, lng)
    
    if weather:
        temp = weather.get("T1H", "??")
        pty_code = int(weather.get("PTY", 0))
        pty_desc = {0: "맑음", 1: "비", 2: "비/눈", 3: "눈", 4: "소나기"}.get(pty_code, "맑음")
        weather_info = f"현재 상태 {pty_desc}, 기온 {temp}도, 습도 {weather.get('REH')}%"
    else:
        weather_info = "날씨 정보 확인 불가"

    user_prompt = f"시간: {current_time}, 날씨: {weather_info}. 이 상황에 맞는 메뉴 6개를 추천하고 그중 베스트 하나를 골라줘."

    try:
        response = ollama.chat(
            model='llama3.1',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_prompt},
            ],
            format='json'
        )
        
        result = json.loads(response['message']['content'])
        return result
        
    except Exception as e:
        print(f"AI 추천 에러: {e}")
        return {
            "reason": "서비스 일시 점검 중입니다.",
            "menus": ["제육볶음", "김치찌개", "돈까스", "비빔밥", "된장찌개", "라면"],
            "selected_index": 0
        }