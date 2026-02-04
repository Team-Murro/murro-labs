import requests
import json
import random
import os
from datetime import datetime

# [유지] K3s 환경 대응 (기본값: 10.42.0.1)
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

    # [복구] "머로도사" 페르소나 + 별점(Stars) 출력 방식
    prompt = f"""
    당신은 30년 경력의 용한 사주명리학자 '머로도사'입니다.
    오늘 날짜는 {today_str}입니다.
    
    [사용자 정보]
    - 생년월일: {korean_date} (이 날짜를 절대 바꾸지 마세요)
    - 성별: {gender}
    - 태어난 시간: {birth_time}
    
    [지시사항]
    1. 말투는 "~~하는구려", "~~할 게야", "조심하게나" 같은 노인 도사 말투를 쓰세요.
    2. 생년월일을 다시 언급하지 말고, 바로 운세 풀이로 들어가세요.
    3. 금전운(wealth_luck)은 반드시 별 이모티콘(⭐) 1개~5개 사이로 표현하세요.
    
    [출력 형식 - JSON Only]
    {{
        "wealth_luck": "⭐⭐⭐⭐ (별점 형태로 출력)",
        "total_score": 90 (0~100 사이 숫자),
        "lucky_color": "행운의 색상 (한글)",
        "comment": "도사님 말투로 작성된 5문장 내외의 운세 풀이"
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
        data = json.loads(result_json['response'])
        
        # [안전장치] 혹시 AI가 별점을 안 주면 점수에 맞춰서 강제 변환
        if 'wealth_luck' in data and not str(data['wealth_luck']).startswith('⭐'):
            try:
                # 숫자로 왔을 경우 별로 변환 (예: 80 -> ⭐⭐⭐⭐)
                score = int(str(data['wealth_luck']).replace('점','').strip())
                stars = min(5, max(1, score // 20))
                data['wealth_luck'] = "⭐" * stars
            except:
                data['wealth_luck'] = "⭐⭐⭐"

        # [유지] 행운의 숫자는 화면에 안 띄우더라도 데이터 구조상 빈 리스트로 둠
        if 'lucky_numbers' not in data:
            data['lucky_numbers'] = []
            
        return data

    except Exception as e:
        print(f"Fortune Error ({OLLAMA_HOST}): {e}")
        return {
            "wealth_luck": "⭐⭐⭐",
            "total_score": 75,
            "lucky_color": "청색",
            "lucky_numbers": [],
            "comment": "허허, 오늘은 기운이 닿지 않아 점괘가 흐릿하구나. 잠시 쉬었다가 다시 물어보거라."
        }