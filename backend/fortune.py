import requests
import json
import random
import os
from datetime import datetime

# [설정] K3s 환경 대응 (기본값: 10.42.0.1)
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

    # [수정] 말투를 확실한 '노인 도사' 컨셉으로 고정
    prompt = f"""
    당신은 산속에서 50년간 수련한 사주명리학 대가 '머로도사'입니다.
    
    [오늘 날짜] {today_str}
    [사용자 정보] {korean_date}생, {gender}
    
    [지시사항]
    1. 말투: 반드시 "~~하는구려", "~~할 게야", "조심하게나", "허허" 같은 옛날 노인 도사 말투(하게체)를 쓰세요. ("해요", "습니다" 금지)
    2. 내용: "이봐야" 같은 번역투 절대 금지. 자연스러운 한국어로 점괘를 풀이하세요.
    3. 금전운(wealth_luck): 반드시 별 이모티콘(⭐) 1개~5개로만 표현하세요. (예: ⭐⭐⭐⭐)
    
    [출력 예시 - JSON Only]
    {{
        "wealth_luck": "⭐⭐⭐⭐",
        "total_score": 92,
        "lucky_color": "청색",
        "comment": "허허, 자네 오늘 기운이 아주 좋구려. 동쪽에서 귀인이 나타날 운세야. 다만 재물을 너무 탐하면 탈이 날 수 있으니 조심하게나."
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
            timeout=40 # 타임아웃 넉넉하게
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # [안전장치] AI가 별점을 까먹고 숫자로 주면 강제로 별로 변환
        if 'wealth_luck' in data and not str(data['wealth_luck']).startswith('⭐'):
            try:
                # 숫자로 왔을 경우 (예: 80 -> ⭐⭐⭐⭐)
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
        # 에러 발생 시 기본값 리턴 (프론트 에러 방지)
        return {
            "wealth_luck": "⭐⭐⭐",
            "total_score": 70,
            "lucky_color": "황금색",
            "lucky_numbers": [],
            "comment": "허허, 오늘은 구름이 끼어 점괘가 잘 보이지 않는구려. 잠시 뒤에 다시 찾아오게나."
        }