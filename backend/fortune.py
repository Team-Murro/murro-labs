import requests
import json
import random
import os
from datetime import datetime

# [설정] K3s 환경 대응
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

def format_korean_date(date_str):
    try:
        parts = date_str.split('-')
        if len(parts) == 3:
            return f"{parts[0]}년 {parts[1]}월 {parts[2]}일"
        return date_str
    except:
        return date_str

async def get_fortune_reading(birth_date: str, birth_time: str, gender: str):
    korean_date = format_korean_date(birth_date)
    today_str = datetime.now().strftime("%Y년 %m월 %d일")

    # [수정] 복잡한 페르소나 제거, 표준어 사용 지시
    prompt = f"""
    당신은 사주명리학 전문가입니다. 아래 정보를 바탕으로 오늘의 운세를 분석해 주세요.
    
    [오늘 날짜] {today_str}
    [사용자 정보] {korean_date}생, {gender}
    
    [지시사항]
    1. 말투: 정중하고 부드러운 "해요체"(존댓말)를 사용하세요. (예: "좋은 기운이 느껴져요.")
    2. 내용: 번역투나 어색한 문장 없이 자연스러운 한국어로 작성하세요.
    3. 금전운(wealth_luck): 반드시 별 이모티콘(⭐) 1개~5개로만 표현하세요.
    
    [출력 예시 - JSON Only]
    {{
        "wealth_luck": "⭐⭐⭐⭐",
        "total_score": 92,
        "lucky_color": "청색",
        "comment": "오늘은 주변 사람들과의 소통이 중요한 날이에요. 작은 오해가 생길 수 있으니 말조심하는 것이 좋겠어요. 행운이 당신과 함께할 거예요."
    }}
    """

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama3.1", 
                "prompt": prompt,
                "format": "json",
                "stream": False,
                # [팁] 창의성보다는 안정성을 위해 온도를 낮춤
                "options": {
                    "temperature": 0.3 
                }
            },
            timeout=40
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # [안전장치] 데이터 검증 로직 유지
        if 'wealth_luck' in data and not str(data['wealth_luck']).startswith('⭐'):
            try:
                val = str(data['wealth_luck'])
                score = int(''.join(filter(str.isdigit, val)))
                stars = min(5, max(1, score // 20))
                data['wealth_luck'] = "⭐" * stars
            except:
                data['wealth_luck'] = "⭐⭐⭐"

        if 'lucky_numbers' not in data:
            data['lucky_numbers'] = []
            
        return data

    except Exception as e:
        print(f"Fortune Error ({OLLAMA_HOST}): {e}")
        return {
            "wealth_luck": "⭐⭐⭐",
            "total_score": 70,
            "lucky_color": "황금색",
            "lucky_numbers": [],
            "comment": "잠시 기운이 흐려져 운세를 읽지 못했어요. 잠시 후에 다시 시도해 주세요."
        }