from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import json
import random

router = APIRouter()

# [수정] Ollama 모델이 더 똑똑하게 알아먹도록 날짜 포맷팅 함수 추가
def format_korean_date(date_str):
    try:
        # yyyy-mm-dd 형식이면 분리해서 한글로 리턴
        parts = date_str.split('-')
        if len(parts) == 3:
            return f"{parts[0]}년 {parts[1]}월 {parts[2]}일"
        return date_str
    except:
        return date_str

class FortuneRequest(BaseModel):
    birthDate: str
    birthTime: str
    gender: str

@router.post("/fortune")
async def get_fortune(data: FortuneRequest):
    # [수정] 입력된 날짜를 확실한 한글 포맷으로 변환
    korean_date = format_korean_date(data.birthDate)
    
    # 프롬프트 강화: 날짜를 절대 바꾸지 말라고 신신당부
    prompt = f"""
    당신은 전문적인 사주팔자 상담사입니다. 아래 사용자의 정보를 바탕으로 오늘의 운세를 봐주세요.
    
    [사용자 정보]
    - 생년월일: {korean_date} (이 날짜를 절대 변경하지 마세요. 사용자는 {korean_date}에 태어났습니다.)
    - 성별: {data.gender}
    - 태어난 시간: {data.birthTime}
    
    [출력 형식 - JSON]
    반드시 아래 JSON 형식으로만 답변하세요. 마크다운이나 잡담은 하지 마세요.
    {{
        "wealth_luck": "금전운 점수 (0~100)",
        "total_score": "총점 (0~100)",
        "lucky_color": "행운의 색상 (영어)",
        "lucky_numbers": [숫자1, 숫자2, 숫자3, 숫자4, 숫자5, 숫자6],
        "comment": "운세 상세 풀이 (존댓말로 친절하게, {korean_date}생이라는 점을 언급하며 해석)"
    }}
    """

    try:
        # 올라마 호출 (모델명은 사용 중인 것으로 유지)
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1",  # 혹시 llama3가 아니라면 mistral 등으로 변경 필요
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        
        result = response.json()
        return json.loads(result['response'])

    except Exception as e:
        print(f"Ollama Error: {e}")
        # 에러 발생 시 더미 데이터라도 리턴해서 프론트가 죽지 않게 함
        return {
            "wealth_luck": 85,
            "total_score": 90,
            "lucky_color": "Gold",
            "lucky_numbers": [7, 12, 23, 34, 41, 45],
            "comment": "죄송합니다. 인공지능 신령님이 잠시 자리를 비우셨네요. (서버 연결 오류) 하지만 오늘 당신의 운세는 맑음입니다!"
        }