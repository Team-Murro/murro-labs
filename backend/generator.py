import requests
import json
import os
import random
import re

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "") # 환경변수명 확인 필요

def get_image_url(keyword):
    """Unsplash 키워드 기반 이미지 검색 (실패 시 랜덤 이미지)"""
    if not UNSPLASH_KEY:
        seed = random.randint(1, 99999)
        return f"https://picsum.photos/seed/{seed}/600/800"

    safe_keyword = keyword.split(',')[0].strip()
    if re.search('[가-힣]', safe_keyword): 
        safe_keyword = "concept"

    url = f"https://api.unsplash.com/search/photos?query={safe_keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=3)
        data = res.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    except Exception:
        pass
    
    seed = random.randint(1, 99999)
    return f"https://picsum.photos/seed/{seed}/600/800"

def generate_game_data():
    """창의성을 극대화한 AI 밸런스 게임 생성기"""
    
    # [수정] 고정 카테고리 대신 AI에게 자유로운 주제 부여를 위한 힌트만 제공
    topic_hints = ["일상의 난제", "황당한 초능력", "음식 취향", "직장/학교 생활", "연애 가치관", "생존 시나리오"]
    selected_hint = random.choice(topic_hints)

    prompt = f"""
    You are a creative balance game designer. 
    Create a "Would You Rather" question in Korean that is extremely difficult to choose.
    Topic Hint: {selected_hint} (But feel free to create anything funny and unique).

    [RULES]
    1. Output MUST be valid JSON only.
    2. Use NATURAL, trendy Korean.
    3. Option A and B must be short and impactful.
    4. 'keyword_a' and 'keyword_b' MUST be English keywords for image searching.

    [JSON Format]
    {{
        "question": "질문 내용",
        "option_a": "선택지 A",
        "keyword_a": "English keyword A",
        "option_b": "선택지 B",
        "keyword_b": "English keyword B"
    }}
    """
    
    payload = {
        "model": "llama3.1",
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.9,    # [상향] 창의성 및 다양성 확보
            "top_p": 0.95,
            "repeat_penalty": 1.1  # 중복 단어 방지
        }
    }
    
    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=40)
        result = res.json()
        content = json.loads(result['response'])
        
# 이미지 URL 생성 및 할당
        content['img_a'] = get_image_url(content.get('keyword_a', 'object'))
        content['img_b'] = get_image_url(content.get('keyword_b', 'object'))
        
        # [중요] DB에 없는 컬럼(keyword_a, b)은 제거하고 반환해야 에러가 안 납니다!
        content.pop('keyword_a', None)
        content.pop('keyword_b', None)
        
        return content

    except Exception as e:
        print(f"AI 생성 에러: {e}")
        return None