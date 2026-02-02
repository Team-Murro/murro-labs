# backend/generator.py
import requests
import json
import os
import random

# 환경변수에서 설정 가져오기 (없으면 기본값)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "") # 키 없으면 빈 문자열

def get_image_url(keyword):
    """Unsplash 키가 있으면 검색하고, 없으면 랜덤 이미지 사용"""
    if not UNSPLASH_KEY:
        # 키가 없으면 무료 랜덤 이미지 서비스 사용 (테스트용)
        seed = random.randint(1, 1000)
        return f"https://picsum.photos/seed/{seed}/600/800"

    url = f"https://api.unsplash.com/search/photos?query={keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=3)
        data = res.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"이미지 검색 실패: {e}")
    
    # 실패 시 랜덤 이미지
    seed = random.randint(1, 1000)
    return f"https://picsum.photos/seed/{seed}/600/800"

def generate_game_data():
    """Ollama에게 밸런스 게임 생성을 요청"""
    prompt = """
    Create a funny, short 'Balance Game' question for Koreans.
    Output ONLY JSON format.
    
    Format:
    {
        "question": "짧고 강렬한 질문 (한국어)",
        "option_a": "선택지 A (한국어)",
        "keyword_a": "Simple English keyword for A image",
        "option_b": "선택지 B (한국어)",
        "keyword_b": "Simple English keyword for B image"
    }
    """
    
    payload = {
        "model": "llama3.1", # ✅ [수정] llama3 -> llama3.1 로 변경!
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        print(f"🤖 AI 게임 생성 요청 (Model: {payload['model']})...")
        res = requests.post(OLLAMA_URL, json=payload, timeout=30)
        result = res.json()
        
        # ✅ [추가] Ollama가 에러를 뱉었는지 확인하는 안전장치
        if "error" in result:
            print(f"❌ Ollama API 에러 반환: {result['error']}")
            return None
            
        content = json.loads(result['response'])
        
        # 이미지 주소 확보
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
        print(f"❌ 생성 로직 에러: {e}")
        # 혹시 result가 존재한다면 내용도 같이 출력해서 디버깅
        try:
            if 'result' in locals(): print(f"🔍 응답 내용: {result}")
        except: pass
        return None