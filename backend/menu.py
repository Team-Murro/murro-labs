# backend/menu.py
import ollama
import json
from datetime import datetime
from weather import get_kma_weather  # 이미 만드신 기상청 모듈 임포트

# 음식 전문가 페르소나 설정
SYSTEM_PROMPT = """
당신은 20년 경력의 미식가이자 영양사입니다. 
사용자의 현재 시간, 날씨, 기온을 종합적으로 고려하여 가장 어울리는 식사 메뉴 6가지를 추천합니다.

[절대 원칙]
1. **메뉴 이름은 수식어를 뺀 '일반 명사'로만 출력하세요.** (예: "얼큰한 짬뽕" -> "짬뽕")
2. 기상청 날씨 데이터(기온, 강수 형태)에 민감하게 반응하세요.
   - 강수 형태가 '비'나 '눈'이면 파전, 칼국수, 짬뽕 등을 우선 고려하세요.
   - 기온이 28도 이상이면 냉면, 모밀 등 시원한 음식을 고려하세요.
   - 기온이 5도 이하이면 국밥, 전골 등 따뜻한 음식을 고려하세요.
3. 답변은 오직 **JSON 데이터만** 출력하세요.

JSON 형식:
{
  "reason": "현재 계신 곳은 비가 오고 기온이 낮아 쌀쌀하네요. 이런 날씨엔 따뜻한 국물이 최고죠.",
  "menus": ["칼국수", "수제비", "김치전", "짬뽕", "우동", "국밥"]
}
"""

async def get_menu_recommendation(lat: float, lng: float, current_time: str):
    # 1. 기상청 API를 통해 실시간 날씨 데이터 가져오기
    weather = get_kma_weather(lat, lng)
    
    # 데이터 파싱 (기상청 코드 변환)
    if weather:
        temp = weather.get("T1H", "??") # 기온
        pty_code = int(weather.get("PTY", 0)) # 강수 형태
        pty_desc = {0: "맑음", 1: "비", 2: "비 또는 눈", 3: "눈", 4: "소나기"}.get(pty_code, "맑음")
        weather_info = f"현재 상태 {pty_desc}, 기온 {temp}도"
    else:
        weather_info = "날씨 정보 확인 불가 (쾌적한 환경 가정)"

    # 계절 계산
    month = datetime.now().month
    season = "겨울" if month in [12, 1, 2] else "봄" if month in [3, 4, 5] else "여름" if month in [6, 7, 8] else "가을"
    
    # 2. AI에게 보낼 프롬프트 구성
    user_prompt = f"""
    [현재 상황]
    - 시간: {current_time}
    - 계절: {season}
    - **대한민국 기상청 실시간 데이터**: {weather_info}
    
    위 상황을 미식가의 관점에서 분석해서 딱 맞는 대중적인 메뉴 6가지를 추천해줘. 
    추천 이유(reason)에는 '기상청 날씨'를 언급하며 현재 기온이나 비/눈 여부에 맞춘 조언을 자연스럽게 포함해줘.
    """

    try:
        # 3. Ollama Llama 3.1 호출
        response = ollama.chat(
            model='llama3.1',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_prompt},
            ],
            format='json',
            options={'temperature': 0.7} # 미식가다운 창의성을 위해 0.7 유지
        )
        
        content = response['message']['content']
        return json.loads(content)
        
    except Exception as e:
        print(f"❌ 메뉴 추천 AI 에러: {e}")
        # 에러 발생 시 기상청 데이터 기반의 최소한의 기본값 반환
        return {
            "reason": "날씨 데이터를 분석하는 도중 오류가 발생했지만, 지금 가장 인기 있는 메뉴들을 추천드려요.",
            "menus": ["제육볶음", "김치찌개", "돈까스", "비빔밥", "된장찌개", "라면"]
        }