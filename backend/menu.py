# backend/menu.py
import ollama
import json
import requests
from datetime import datetime

# ==========================================
# [설정] OpenWeatherMap API 키를 여기에 입력하세요
OPENWEATHER_API_KEY = "89eb68618bb55d31d082dff0f9fca98c"
# ==========================================

# 음식 전문가 페르소나
SYSTEM_PROMPT = """
당신은 20년 경력의 미식가이자 영양사입니다. 
사용자의 현재 시간, 날씨, 기온을 종합적으로 고려하여 가장 어울리는 식사 메뉴 6가지를 추천합니다.

[절대 원칙]
1. **메뉴 이름은 수식어를 뺀 '일반 명사'로만 출력하세요.** (예: "얼큰한 짬뽕" -> "짬뽕")
2. 날씨와 기온에 민감하게 반응하세요. (예: 비 오면 파전/칼국수, 더우면 냉면, 추우면 국물)
3. 답변은 오직 **JSON 데이터만** 출력하세요.

JSON 형식:
{
  "reason": "현재 서울은 비가 오고 쌀쌀하네요. 이런 날씨엔 따뜻한 국물이 최고죠.",
  "menus": ["칼국수", "수제비", "김치전", "짬뽕", "우동", "국밥"]
}
"""

def get_current_weather(lat: float, lng: float):
    """OpenWeatherMap API를 통해 실시간 날씨 조회"""
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={OPENWEATHER_API_KEY}&units=metric&lang=kr"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            weather_desc = data['weather'][0]['description'] # 예: 맑음, 비, 눈
            temp = data['main']['temp'] # 섭씨 온도
            return f"{weather_desc}, 기온 {temp}도"
        else:
            return "날씨 정보 확인 불가"
    except Exception as e:
        print(f"?? 날씨 API 에러: {e}")
        return "날씨 정보 확인 불가"

async def get_menu_recommendation(lat: float, lng: float, current_time: str):
    # 1. 실시간 날씨 가져오기
    weather_info = get_current_weather(lat, lng)
    
    # 계절 계산 (보조 정보)
    month = datetime.now().month
    season = "겨울" if month in [12, 1, 2] else "봄" if month in [3, 4, 5] else "여름" if month in [6, 7, 8] else "가을"
    
    # 2. AI에게 보낼 질문 구성
    user_prompt = f"""
    [현재 상황]
    - 시간: {current_time}
    - 계절: {season}
    - **실시간 날씨 및 기온**: {weather_info}
    
    위 상황에 딱 맞는 대중적인 식사 메뉴 6가지를 추천해줘. 
    추천 이유(reason)에는 날씨 이야기를 꼭 포함해서 자연스럽게 말해줘.
    """

    try:
        response = ollama.chat(
            model='llama3.1',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_prompt},
            ],
            format='json',
            options={'temperature': 0.8}
        )
        
        content = response['message']['content']
        return json.loads(content)
        
    except Exception as e:
        print(f"?? 메뉴 추천 AI 에러: {e}")
        # 에러 시 기본값 (날씨 모를 때 무난한 것들)
        return {
            "reason": "날씨 정보를 불러오지 못했지만, 언제 먹어도 맛있는 메뉴들입니다.",
            "menus": ["제육볶음", "김치찌개", "돈까스", "비빔밥", "된장찌개", "라면"]
        }
