import requests
import os
import random
import re

# Unsplash 키가 없으면 랜덤 이미지가 나옵니다.
UNSPLASH_KEY = "la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg"

def get_image_url(keyword):
    """
    영어 키워드를 받아서 Unsplash에서 이미지 URL을 가져오는 함수
    (키워드가 없거나 검색 실패 시 랜덤 이미지 반환)
    """
    # 1. 키워드가 없으면 랜덤 이미지
    if not keyword or not UNSPLASH_KEY:
        seed = random.randint(1, 99999)
        return f"https://picsum.photos/seed/{seed}/600/800"

    # 2. 키워드 정제 (쉼표 앞부분만 사용, 한글 포함되면 검색 포기)
    safe_keyword = keyword.split(',')[0].strip()
    if re.search('[가-힣]', safe_keyword): 
        # 한글 키워드는 Unsplash 검색이 잘 안되므로 그냥 랜덤 컨셉으로 대체
        seed = random.randint(1, 99999)
        return f"https://picsum.photos/seed/{seed}/600/800"

    # 3. Unsplash API 호출
    url = f"https://api.unsplash.com/search/photos?query={safe_keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=2) # 2초 안에 안 오면 포기
        data = res.json()
        if data.get('results'):
            return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"이미지 검색 실패 ({safe_keyword}): {e}")
    
    # 4. 실패 시 랜덤 이미지 fallback
    seed = random.randint(1, 99999)
    return f"https://picsum.photos/seed/{seed}/600/800"
