import requests
import json
import random

# [유지] 날짜 인식 오류 방지용 (내부 계산에만 쓰고, 출력 텍스트엔 넣지 않음)
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
    
    prompt = f"""
    당신은 전문적인 사주명리학자입니다.
    
    [사용자 정보]
    - 생년월일: {korean_date} (이 날짜를 기준으로 운세를 분석하되, 답변 텍스트에는 날짜를 언급하지 마세요.)
    - 성별: {gender}
    - 태어난 시간: {birth_time}
    
    [지시사항]
    1. "@@년생이시군요", "사주를 보니..." 같은 서론은 전부 생략하세요.
    2. 바로 오늘의 재물운, 애정운, 건강운을 종합한 운세 풀이를 시작하세요.
    3. 말투는 정중하고 부드러운 존댓말(해요체)을 사용하세요.
    4. 텍스트 내에 행운의 숫자나 로또 번호를 절대 나열하지 마세요.
    
    [출력 형식 - JSON Only]
    {{
        "wealth_luck": "금전운 점수 (0~100)",
        "total_score": "총점 (0~100)",
        "lucky_color": "행운의 색상 (한글)",
        "comment": "군더더기 없는 깔끔한 운세 해석 본문 (5문장 내외)"
    }}
    """

    try:
        response = requests.post(
            "http://10.42.0.1:11434/api/generate",
            json={
                "model": "llama3.1", 
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # 프론트엔드 호환성을 위해 lucky_numbers 필드는 빈 리스트나 임의값으로 채워둠 (화면엔 안 나옴)
        if 'lucky_numbers' not in data:
            data['lucky_numbers'] = []
            
        return data

    except Exception as e:
        print(f"Fortune Error: {e}")
        return {
            "wealth_luck": 80,
            "total_score": 85,
            "lucky_color": "황금색",
            "lucky_numbers": [],
            "comment": "잠시 기운이 닿지 않아 운세를 읽지 못했습니다. 잠시 후 다시 시도해주세요."
        }