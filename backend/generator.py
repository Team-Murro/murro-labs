import requests
import json
import os
import random
import re

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "")

def get_image_url(keyword):
    """이미지 검색 로직 (기존 동일)"""
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
    """진짜 짧은 밸런스 게임 생성기 (한국어 프롬프트 적용)"""
    
    themes = ["음식", "초능력", "돈", "생존", "연애", "직장", "성격"]
    selected_theme = random.choice(themes)

    # [핵심 변경] 프롬프트를 한국어로 변경하고 예시를 강제 주입
    prompt = f"""
    당신은 한국의 '밸런스 게임' 마스터입니다.
    주제 '{selected_theme}'에 대해 아주 짧고 선택하기 어려운 질문을 하나 만드세요.

    [절대 규칙]
    1. 질문은 20자 이내로 끝내세요. (설명 금지)
    2. 선택지 A와 B는 5자 이내의 단어여야 합니다. (문장 금지)
    3. 오직 JSON 형식으로만 응답하세요.

    [정답 예시]
    {{
        "question": "평생 한 가지만 먹는다면?",
        "option_a": "물렁한 라면",
        "keyword_a": "soggy noodles",
        "option_b": "설익은 밥",
        "keyword_b": "uncooked rice"
    }}

    위 예시처럼 JSON만 출력하세요.
    """
    
    payload = {
        "model": "llama3.1",
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.7,    # 창의성을 조금 낮춰서 지시를 잘 따르게 함
            "top_p": 0.9,
            "max_tokens": 100      # [중요] 답변 길이를 물리적으로 제한
        }
    }
    
    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=10)
        result = res.json()
        
        if "response" not in result: return None
        
        content = json.loads(result['response'])
        
        # 이미지 URL 매칭
        content['img_a'] = get_image_url(content.get('keyword_a', 'object'))
        content['img_b'] = get_image_url(content.get('keyword_b', 'object'))
        
        # 키워드 정리
        content.pop('keyword_a', None)
        content.pop('keyword_b', None)
        
        return content

    except Exception as e:
        print(f"AI 생성 에러: {e}")
        return None