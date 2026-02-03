import sys
import os

# backend 모듈을 찾기 위한 경로 설정
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import SessionLocal, engine, Base
from backend.models import BalanceGame

# 테이블이 없으면 생성
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# 100% 한국인 정서 맞춤형 고퀄리티 질문 리스트 (30개)
initial_data = [
    {"q": "평생 한 가지 음식만 먹어야 한다면?", "a": "평생 라면", "ka": "ramen noodles", "b": "평생 치킨", "kb": "fried chicken"},
    {"q": "다시 태어난다면?", "a": "재벌 2세", "ka": "luxury car money", "b": "IQ 200 천재", "kb": "scientist genius"},
    {"q": "여름 vs 겨울, 평생 하나만?", "a": "평생 여름", "ka": "summer beach sun", "b": "평생 겨울", "kb": "winter snow"},
    {"q": "진정한 친구 1명 vs 인맥 넓은 친구 100명?", "a": "진정한 1명", "ka": "best friend hug", "b": "인맥 100명", "kb": "party crowd people"},
    {"q": "100억 받고 50살 더 먹기 vs 그냥 살기?", "a": "100억+50살", "ka": "old rich man", "b": "그냥 살기", "kb": "young broke"},
    {"q": "남들이 내 생각 읽기 vs 내가 남 생각 읽기?", "a": "읽히기", "ka": "mind reading open", "b": "읽기", "kb": "spy watching"},
    {"q": "평생 양치 안 하기 vs 평생 샤워 안 하기?", "a": "양치 포기", "ka": "bad breath teeth", "b": "샤워 포기", "kb": "dirty body mud"},
    {"q": "과거로 갈 수 있다면?", "a": "10년 전으로", "ka": "clock time travel", "b": "10년 후로", "kb": "future city sci-fi"},
    {"q": "스마트폰 없이 살기 vs 친구 없이 살기?", "a": "폰 없이", "ka": "nature camping", "b": "친구 없이", "kb": "lonely gamer room"},
    {"q": "나를 사랑하는 사람 vs 내가 사랑하는 사람?", "a": "사랑 받는 것", "ka": "propose flowers", "b": "사랑 하는 것", "kb": "crush love heart"},
    {"q": "평생 탄산 끊기 vs 평생 라면 끊기?", "a": "탄산 끊기", "ka": "water glass", "b": "라면 끊기", "kb": "healthy salad"},
    {"q": "365일 야근 (연봉 3배) vs 백수 (연봉 0원)?", "a": "야근 지옥", "ka": "office work night", "b": "가난한 백수", "kb": "homeless sleeping"},
    {"q": "똥맛 카레 vs 카레맛 똥?", "a": "똥맛 카레", "ka": "curry poop", "b": "카레맛 똥", "kb": "poop emoji"},
    {"q": "사막에서 조난 vs 북극에서 조난?", "a": "사막", "ka": "desert hot sun", "b": "북극", "kb": "polar bear ice"},
    {"q": "내일 지구가 멸망한다면?", "a": "가족과 함께", "ka": "family dinner home", "b": "혼자 즐기기", "kb": "party solo crazy"},
    {"q": "노래 잘하기 vs 춤 잘 추기?", "a": "노래 신", "ka": "singer stage mic", "b": "댄스 신", "kb": "dancer kpop"},
    {"q": "얼굴 천재 vs 몸매 천재?", "a": "얼굴 천재", "ka": "handsome beautiful face", "b": "몸매 천재", "kb": "muscle fitness body"},
    {"q": "평생 고기 끊기 vs 평생 밀가루 끊기?", "a": "고기 끊기", "ka": "vegetable vegan", "b": "밀가루 끊기", "kb": "steak meat bbq"},
    {"q": "말 못하는 애인 vs 말 안 통하는 애인?", "a": "말 못함", "ka": "quiet couple silence", "b": "말 안 통함", "kb": "arguing couple angry"},
    {"q": "토마토맛 토 vs 토맛 토마토?", "a": "토마토맛 토", "ka": "vomit sick", "b": "토맛 토마토", "kb": "rotten tomato"},
    {"q": "평생 두통 vs 평생 치통?", "a": "두통", "ka": "headache pain", "b": "치통", "kb": "toothache dentist"},
    {"q": "모르는 게 약 vs 아는 게 힘?", "a": "모르는 게 약", "ka": "sleeping baby peace", "b": "아는 게 힘", "kb": "library books study"},
    {"q": "원수와 사랑에 빠지기 vs 절친과 원수 되기?", "a": "원수와 사랑", "ka": "romeo juliet kiss", "b": "절친과 원수", "kb": "fight punch friend"},
    {"q": "투명인간 vs 하늘 날기?", "a": "투명인간", "ka": "invisible ghost", "b": "하늘 날기", "kb": "superman flying sky"},
    {"q": "군대 재입대 vs 감옥 1년?", "a": "군대 재입대", "ka": "soldier army korea", "b": "감옥 1년", "kb": "prison jail bars"},
    {"q": "평생 폰 배터리 5% vs 평생 인터넷 느림?", "a": "배터리 5%", "ka": "low battery phone", "b": "인터넷 느림", "kb": "loading spinner slow"},
    {"q": "월 200 백수 vs 월 1000 직장인?", "a": "월 200 백수", "ka": "relaxing beach holiday", "b": "월 1000 직장인", "kb": "busy office money"},
    {"q": "5살 연하 vs 5살 연상?", "a": "연하", "ka": "young student cute", "b": "연상", "kb": "mature suit office"},
    {"q": "짜장면 vs 짬뽕?", "a": "짜장면", "ka": "black bean noodles", "b": "짬뽕", "kb": "spicy seafood soup"},
    {"q": "찍먹 vs 부먹?", "a": "찍먹", "ka": "dipping sauce", "b": "부먹", "kb": "pouring sauce food"}
]

# 기존 데이터 삭제 (중복 방지 및 초기화)
print("🗑️ 기존 밸런스 게임 데이터를 삭제합니다...")
db.query(BalanceGame).delete()

# 데이터 삽입
print("🌱 새로운 데이터를 심는 중입니다...")
for item in initial_data:
    game = BalanceGame(
        question=item["q"],
        option_a=item["a"],
        keyword_a=item["ka"], # DB에 키워드로 저장
        option_b=item["b"],
        keyword_b=item["kb"],
        count_a=0,
        count_b=0
    )
    db.add(game)

db.commit()
print(f"✅ 총 {len(initial_data)}개의 밸런스 게임 질문 저장 완료!")
db.close()