# backend/generator.py (전체 덮어쓰기)
import requests
import json
import os
import random
import re

# 환경변수 설정
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "")

def get_image_url(keyword):
    """Unsplash 키워드 검색"""
    if not UNSPLASH_KEY:
        seed = random.randint(1, 10000)
        return f"https://picsum.photos/seed/{seed}/600/800"

    safe_keyword = keyword.split(',')[0].strip()
    # 한글이 섞여있으면 검색어 오염으로 간주하고 랜덤 이미지
    if re.search('[가-힣]', safe_keyword): 
        safe_keyword = "random"

    url = f"https://api.unsplash.com/search/photos?query={safe_keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=3)
        data = res.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"이미지 검색 실패: {e}")
    
    seed = random.randint(1, 10000)
    return f"https://picsum.photos/seed/{seed}/600/800"

def is_valid_korean(text):
    """최소한의 한국어 문법 구조 검사"""
    # 1. 길이가 너무 짧으면 실패
    if len(text) < 10: return False
    
    # 2. 완성형 한글 빈도 검사 (자음/모음만 있는 경우 거름)
    korean_chars = re.findall('[가-힣]', text)
    if len(korean_chars) < 5: return False
    
    # 3. 외계어/깨진 문자/일본어/한자 차단
    # (유니코드 범위: 일본어, 한자, 특수문자 등)
    if re.search('[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]', text):
        return False
        
    return True

def generate_game_data():
    """안정적인 밸런스 게임 생성기"""
    
    # 주제를 아주 쉽고 명확한 것으로 한정
    categories = [
        "Food (라면 vs 햄버거)", 
        "Love (친구 vs 애인)", 
        "Superpower (투명인간 vs 하늘날기)", 
        "Money (10억 받고 10년 늙기 vs 그냥 살기)", 
        "Survival (좀비 세상 vs 무인도)", 
        "Daily Life (평생 여름 vs 평생 겨울)"
    ]
    
    for attempt in range(3):
        selected_category = random.choice(categories)
        
        # [핵심] 프롬프트를 'System'과 'User' 역할로 명확히 분리하진 못하지만,
        # 지시사항을 아주 단순하고 강력하게 변경
        prompt = f"""
        You are a funny Korean game host.
        Create a "Would You Rather" game scenario based on: {selected_category}.

        [CRITICAL RULES]
        1. Output MUST be valid JSON.
        2. Use NATURAL Korean (한국어). Do NOT use broken words or gibberish.
        3. Options A and B must be short and clear.
        4. Keywords for images must be in English.

        [JSON Format Example]
        {{
            "question": "평생 라면만 먹기 vs 평생 탄산만 마시기",
            "option_a": "라면만 먹기",
            "keyword_a": "ramen noodles",
            "option_b": "탄산만 마시기",
            "keyword_b": "coca cola soda glass"
        }}
        
        Now, generate a new one. JSON only:
        """
        
        payload = {
            "model": "llama3.1",
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.4,    # [변경] 0.85 -> 0.4 (창의성 억제, 안정성 확보)
                "top_p": 0.9,
                "repeat_penalty": 1.0  # [변경] 1.2 -> 1.0 (페널티 제거! 한국어 문법 살리기)
            }
        }
        
        try:
            print(f"🤖 AI 생성 시도 ({attempt+1}/3)...")
            res = requests.post(OLLAMA_URL, json=payload, timeout=40)
            result = res.json()
            
            if "error" in result: continue

            content = json.loads(result['response'])
            
            # 검증: 질문 + 옵션 합쳐서 한국어 체크
            full_text = content.get('question', '') + content.get('option_a', '') + content.get('option_b', '')
            
            if not is_valid_korean(full_text):
                print(f"❌ 문법 오류 감지 (재시도): {full_text[:30]}...")
                continue

            # 이미지 URL 생성
            img_a = get_image_url(content.get('keyword_a', 'random'))
            img_b = get_image_url(content.get('keyword_b', 'random'))
            
            return {
                "question": content['question'],
                "option_a": content['option_a'],
                "img_a": img_a,
                "option_b": content['option_b'],
                "img_b": img_b
            }
            
        except Exception as e:
            print(f"❌ 생성 에러: {e}")
            continue
            
    return None