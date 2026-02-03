import sys
import os

# 경로 자동 인식: 현재 위치를 시스템 경로에 추가
sys.path.append(os.getcwd())

# ---------------------------------------------------------
# 환경에 따라 import 경로를 유연하게 바꿈
# ---------------------------------------------------------
try:
    # 1. 로컬 개발 환경 (backend 폴더가 있을 때)
    from backend.database import SessionLocal, engine, Base
    from backend.models import BalanceGame
    print("🖥️  로컬 모드로 실행 중...")
except ImportError:
    # 2. 파드(Pod) 내부 환경 (파일들이 평평하게 펴져 있을 때)
    try:
        from database import SessionLocal, engine, Base
        from models import BalanceGame
        print("🐳 파드(Docker) 내부 모드로 실행 중...")
    except ImportError as e:
        print("❌ 오류: database.py나 models.py를 찾을 수 없습니다.")
        print(f"현재 위치: {os.getcwd()}")
        print(f"파일 목록: {os.listdir()}")
        raise e
# ---------------------------------------------------------

def seed_data():
    db = SessionLocal()

    # 1. 기존 테이블 삭제 후 재생성 (초기화)
    print("🗑️  기존 밸런스 게임 데이터를 삭제하고 테이블을 재생성합니다...")
    BalanceGame.__table__.drop(engine)
    Base.metadata.create_all(bind=engine)

    # 2. 데이터 준비 (총 100개)
    initial_data = [
        # --- [음식/취향] ---
        {"question": "평생 한 가지 음식만 먹어야 한다면?", "option_a": "평생 라면", "keyword_a": "ramen noodles", "option_b": "평생 치킨", "keyword_b": "fried chicken"},
        {"question": "찍먹 vs 부먹?", "option_a": "찍먹", "keyword_a": "dipping sauce", "option_b": "부먹", "keyword_b": "pouring sauce food"},
        {"question": "짜장면 vs 짬뽕?", "option_a": "짜장면", "keyword_a": "black bean noodles", "option_b": "짬뽕", "keyword_b": "spicy seafood soup"},
        {"question": "물렁 복숭아 vs 딱딱 복숭아?", "option_a": "물복(물렁)", "keyword_a": "soft peach juicy", "option_b": "딱복(딱딱)", "keyword_b": "hard peach crunch"},
        {"question": "평생 탄산 끊기 vs 평생 라면 끊기?", "option_a": "탄산 끊기", "keyword_a": "no soda drink", "option_b": "라면 끊기", "keyword_b": "no ramen noodles"},
        {"question": "민트초코 호 vs 불호?", "option_a": "민초 호(극호)", "keyword_a": "mint chocolate chip ice cream", "option_b": "민초 불호(치약맛)", "keyword_b": "toothpaste mint"},
        {"question": "소주 vs 맥주?", "option_a": "소주", "keyword_a": "soju bottle glass", "option_b": "맥주", "keyword_b": "beer pint foam"},
        {"question": "팥붕어빵 vs 슈크림붕어빵?", "option_a": "팥붕", "keyword_a": "red bean fish pastry", "option_b": "슈붕", "keyword_b": "custard cream fish pastry"},
        {"question": "김치찌개 vs 된장찌개?", "option_a": "김치찌개", "keyword_a": "kimchi stew pot", "option_b": "된장찌개", "keyword_b": "soybean paste stew"},
        {"question": "비 오는 날 파전 vs 치킨?", "option_a": "파전에 막걸리", "keyword_a": "korean pancake makgeolli", "option_b": "치킨에 맥주", "keyword_b": "fried chicken beer"},
        {"question": "평생 고기 안 먹기 vs 평생 밀가루 안 먹기?", "option_a": "고기 포기", "keyword_a": "vegetables salad", "option_b": "밀가루 포기", "keyword_b": "meat steak bbq"},
        {"question": "카레맛 똥 먹기 vs 똥맛 카레 먹기?", "option_a": "카레맛 똥", "keyword_a": "curry flavor poop poop", "option_b": "똥맛 카레", "keyword_b": "poop flavor curry food"},
        {"question": "후라이드 치킨 vs 양념 치킨?", "option_a": "후라이드", "keyword_a": "crispy fried chicken", "option_b": "양념", "keyword_b": "sweet spicy chicken"},
        {"question": "아메리카노 vs 라떼?", "option_a": "아메리카노", "keyword_a": "iced americano coffee", "option_b": "라떼", "keyword_b": "cafe latte milk"},
        {"question": "여름에 에어컨 없이 살기 vs 겨울에 보일러 없이 살기?", "option_a": "에어컨 없음", "keyword_a": "sweating hot summer fan", "option_b": "보일러 없음", "keyword_b": "freezing cold winter parka"},
        {"question": "평생 커피 끊기 vs 평생 술 끊기?", "option_a": "커피 끊기", "keyword_a": "no coffee cup", "option_b": "술 끊기", "keyword_b": "no alcohol drink"},
        {"question": "떡볶이에 쌀떡 vs 밀떡?", "option_a": "쌀떡", "keyword_a": "rice cake tteokbokki", "option_b": "밀떡", "keyword_b": "wheat cake tteokbokki"},
        {"question": "피자에 파인애플(하와이안) 호 vs 불호?", "option_a": "극호(맛있음)", "keyword_a": "hawaiian pizza pineapple", "option_b": "불호(따뜻한 과일 싫어)", "keyword_b": "pizza no pineapple"},
        {"question": "삼겹살에 소주 vs 치킨에 맥주?", "option_a": "삼쏘", "keyword_a": "pork belly soju grill", "option_b": "치맥", "keyword_b": "chicken beer party"},
        {"question": "회 vs 고기?", "option_a": "회(해산물)", "keyword_a": "sashimi raw fish platter", "option_b": "고기(육류)", "keyword_b": "grilled meat bbq"},

        # --- [가치관/성격] ---
        {"question": "다시 태어난다면?", "option_a": "재벌 2세 (외모 평범)", "keyword_a": "luxury car money rich", "option_b": "존잘/존예 (평범한 집안)", "keyword_b": "super handsome beautiful face"},
        {"question": "100억 받고 50살 더 먹기 vs 그냥 지금 나이로 살기?", "option_a": "100억+50살", "keyword_a": "old rich man money", "option_b": "그냥 살기", "keyword_b": "young broke happy"},
        {"question": "진정한 친구 1명 vs 인맥 넓은 지인 100명?", "option_a": "진정한 1명", "keyword_a": "best friend hug trust", "option_b": "인맥 100명", "keyword_b": "party crowd networking"},
        {"question": "남들이 내 생각 읽기 vs 내가 남 생각 읽기?", "option_a": "남들이 내 생각 읽기", "keyword_a": "mind reading exposed transparent", "option_b": "내가 남 생각 읽기", "keyword_b": "telepathy spy mind control"},
        {"question": "과거로 돌아가기 vs 미래로 가기?", "option_a": "과거(후회 수정)", "keyword_a": "time machine past clock", "option_b": "미래(로또 번호 확인)", "keyword_b": "future city sci-fi"},
        {"question": "내가 사랑하는 사람 vs 나를 사랑해주는 사람?", "option_a": "내가 사랑하는", "keyword_a": "proposing love heart", "option_b": "날 사랑해주는", "keyword_b": "receiving flowers love"},
        {"question": "월 200 백수 vs 월 1000 직장인(야근 매일)?", "option_a": "월 200 백수", "keyword_a": "relaxing beach holiday hammock", "option_b": "월 1000 직장인", "keyword_b": "busy office stressed money"},
        {"question": "5살 연하 vs 5살 연상?", "option_a": "연하", "keyword_a": "young student cute", "option_b": "연상", "keyword_b": "mature suit office professional"},
        {"question": "나쁜 소식 먼저 듣기 vs 좋은 소식 먼저 듣기?", "option_a": "나쁜 소식 먼저", "keyword_a": "shocked face bad news", "option_b": "좋은 소식 먼저", "keyword_b": "happy face surprise gift"},
        {"question": "1년 동안 폰 없이 살기 vs 1년 동안 친구 없이 살기?", "option_a": "폰 없이 살기", "keyword_a": "no phone nature primitive", "option_b": "친구 없이 살기", "keyword_b": "lonely room solo"},

        # --- [상황/능력] ---
        {"question": "투명인간 vs 하늘 날기?", "option_a": "투명인간", "keyword_a": "invisible man clothes empty", "option_b": "하늘 날기", "keyword_b": "flying superman sky city"},
        {"question": "순간이동 vs 시간정지?", "option_a": "순간이동", "keyword_a": "teleport portal magic", "option_b": "시간정지", "keyword_b": "frozen time world clock stop"},
        {"question": "말 못하는 천재 vs 말 잘하는 바보?", "option_a": "말 못하는 천재", "keyword_a": "genius math formula silent", "option_b": "말 잘하는 바보", "keyword_b": "clown speaker microphone"},
        {"question": "평생 겨울 vs 평생 여름?", "option_a": "평생 겨울", "keyword_a": "winter snow cold jacket", "option_b": "평생 여름", "keyword_b": "summer beach sun hot"},
        {"question": "평생 폰 배터리 5% vs 평생 인터넷 느림(3G)?", "option_a": "배터리 5%", "keyword_a": "low battery icon red", "option_b": "인터넷 느림", "keyword_b": "loading spinner slow snail"},
        {"question": "군대 재입대(이등병) vs 감옥 1년 다녀오기?", "option_a": "군대 재입대", "keyword_a": "soldier army korea drill", "option_b": "감옥 1년", "keyword_b": "jail prison bars cell"},
        {"question": "모르는 게 약 vs 아는 게 힘?", "option_a": "모르는 게 약", "keyword_a": "peaceful ignorance sleeping", "option_b": "아는 게 힘", "keyword_b": "library books study power"},
        {"question": "다시 태어나면 남자 vs 여자?", "option_a": "남자", "keyword_a": "man male gender symbol", "option_b": "여자", "keyword_b": "woman female gender symbol"},
        {"question": "평생 양치 안 하기 vs 평생 샤워 안 하기?", "option_a": "양치 안 하기", "keyword_a": "rotten teeth bad breath", "option_b": "샤워 안 하기", "keyword_b": "dirty smelly fly garbage"},
        {"question": "존잘/존예인데 노잼 vs 평범한데 개그맨급 유머?", "option_a": "존잘 노잼", "keyword_a": "handsome boring face model", "option_b": "평범 꿀잼", "keyword_b": "laughing crowd comedian"},

        # --- [연애/사랑] ---
        {"question": "이성 친구와 1박2일 여행(방 따로) 가능 vs 불가능?", "option_a": "가능(쿨하게)", "keyword_a": "friends travel cool", "option_b": "불가능(절대 안돼)", "keyword_b": "angry jealous couple cross arms"},
        {"question": "애인의 과거, 안다 vs 모른다?", "option_a": "다 알아야 한다", "keyword_a": "detective magnifying glass files", "option_b": "모르는 게 낫다", "keyword_b": "blindfold cover eyes ears"},
        {"question": "잠수 이별 vs 환승 이별?", "option_a": "잠수 이별(연락두절)", "keyword_a": "ghosting phone ignore message", "option_b": "환승 이별(바람)", "keyword_b": "cheating couple broken heart"},
        {"question": "매일 연락하는데 한 달에 한 번 만남 vs 연락 잘 안 되는데 매일 만남?", "option_a": "매일 연락, 월 1회 만남", "keyword_a": "texting phone love distance", "option_b": "연락 두절, 매일 만남", "keyword_b": "dating cafe face to face"},
        {"question": "낮져밤이 vs 낮이밤져?", "option_a": "낮져밤이", "keyword_a": "shy day wolf night", "option_b": "낮이밤져", "keyword_b": "boss day puppy night"},
        {"question": "애인이 내 친구 깻잎 떼어주기, 허용 vs 불가?", "option_a": "허용(매너)", "keyword_a": "chopsticks side dish manners", "option_b": "불가(끼부림)", "keyword_b": "angry girlfriend dining table"},
        {"question": "소개팅에서 더치페이 하자고 하는 상대?", "option_a": "합리적이다", "keyword_a": "calculator bill split money", "option_b": "정 떨어진다", "keyword_b": "disappointed face wallet"},
        {"question": "장거리 연애(해외) vs 사내 연애(같은 부서)?", "option_a": "장거리 연애", "keyword_a": "airplane video call love", "option_b": "사내 연애", "keyword_b": "office romance desk secret"},
        {"question": "결혼 후, 시댁/처가살이 vs 전세 자금 대출 5억?", "option_a": "시댁/처가살이", "keyword_a": "big family house living together", "option_b": "빚 5억 자취", "keyword_b": "debt bill house poor"},
        {"question": "사랑하는 사람과 가난하게 살기 vs 싫어하는 사람과 부자로 살기?", "option_a": "사랑+가난", "keyword_a": "poor happy couple love", "option_b": "혐오+부자", "keyword_b": "rich unhappy mansion gold"},

        # --- [IT/개발] ---
        {"question": "맥북 vs 윈도우 노트북?", "option_a": "맥북", "keyword_a": "apple macbook laptop", "option_b": "윈도우", "keyword_b": "windows laptop dell asus"},
        {"question": "아이폰 vs 갤럭시?", "option_a": "아이폰", "keyword_a": "iphone apple smartphone", "option_b": "갤럭시", "keyword_b": "samsung galaxy android phone"},
        {"question": "재택근무(연봉 삭감) vs 사무실 출근(연봉 인상)?", "option_a": "재택근무", "keyword_a": "working from home pajamas", "option_b": "사무실 출근", "keyword_b": "subway commute suit office"},
        {"question": "개발자 vs 디자이너?", "option_a": "개발자(코딩)", "keyword_a": "coding matrix screen hacker", "option_b": "디자이너(예술)", "keyword_b": "graphic design art photoshop"},
        {"question": "카톡 vs DM?", "option_a": "카톡", "keyword_a": "kakaotalk chat bubble yellow", "option_b": "인스타 DM", "keyword_b": "instagram dm message logo"},
        {"question": "평생 인터넷 없이 살기 vs 평생 TV 없이 살기?", "option_a": "인터넷 없이", "keyword_a": "offline disconnected cave", "option_b": "TV 없이", "keyword_b": "no television screen black"},
        {"question": "유튜브 프리미엄 vs 넷플릭스?", "option_a": "유튜브 프리미엄", "keyword_a": "youtube logo red play", "option_b": "넷플릭스", "keyword_b": "netflix logo popcorn movie"},
        {"question": "Ctrl+C/V 없는 코딩 vs 마우스 없는 코딩?", "option_a": "복붙 금지", "keyword_a": "typing keyboard hard coding", "option_b": "마우스 금지", "keyword_b": "keyboard shortcuts hacker terminal"},
        {"question": "에러 원인 못 찾기 vs 해결했는데 왜 됐는지 모름?", "option_a": "원인 못 찾음(밤샘)", "keyword_a": "bug stress computer screen", "option_b": "왜 됐는지 모름(찜찜)", "keyword_b": "confused success question mark"},
        {"question": "다크 모드 vs 라이트 모드?", "option_a": "다크 모드", "keyword_a": "dark mode ui black screen", "option_b": "라이트 모드", "keyword_b": "light mode ui white screen"},

        # --- [일상/기타] ---
        {"question": "성악설 vs 성선설?", "option_a": "성악설(인간은 악함)", "keyword_a": "devil evil human nature", "option_b": "성선설(인간은 선함)", "keyword_b": "angel good human nature"},
        {"question": "귀신을 본다 vs 미래를 본다?", "option_a": "귀신 보기", "keyword_a": "ghost horror scary dark", "option_b": "미래 보기", "keyword_b": "crystal ball future fortune"},
        {"question": "평생 양말 안 신기 vs 평생 속옷 안 입기?", "option_a": "양말 안 신기", "keyword_a": "bare feet shoes blister", "option_b": "속옷 안 입기", "keyword_b": "no underwear clothes breeze"},
        {"question": "휴지 없이 살기 vs 비누 없이 살기?", "option_a": "휴지 없음", "keyword_a": "toilet paper empty roll", "option_b": "비누 없음", "keyword_b": "dirty hands germs bacteria"},
        {"question": "머리 안 감기(4일) vs 이 안 닦기(4일)?", "option_a": "머리 안 감기", "keyword_a": "oily hair dirty shampoo", "option_b": "이 안 닦기", "keyword_b": "yellow teeth bad breath"},
        {"question": "토 맛 토마토 vs 토마토 맛 토?", "option_a": "토 맛 토마토", "keyword_a": "vomit flavor tomato fruit", "option_b": "토마토 맛 토", "keyword_b": "tomato flavor vomit puke"},
        {"question": "버스에서 방귀 뀌고 모른 척 vs 트림 크게 하고 사과하기?", "option_a": "방귀(시치미)", "keyword_a": "fart smell bus pokerface", "option_b": "트림(사과)", "keyword_b": "burp loud excuse me"},
        {"question": "10년 전 과거로 vs 10년 후 미래로?", "option_a": "10년 전", "keyword_a": "younger self school uniform", "option_b": "10년 후", "keyword_b": "older self future city"},
        {"question": "내가 좋아하는 아이돌과 사귀기 vs 10억 받기?", "option_a": "최애와 연애", "keyword_a": "kpop idol dating heart", "option_b": "10억 받기", "keyword_b": "lottery cash money pile"},
        {"question": "평생 고구마만 먹기 vs 평생 감자만 먹기?", "option_a": "고구마", "keyword_a": "sweet potato purple", "option_b": "감자", "keyword_b": "potato french fries"},
        {"question": "여름에 패딩 vs 겨울에 반팔?", "option_a": "여름 패딩", "keyword_a": "sweating winter coat summer", "option_b": "겨울 반팔", "keyword_b": "shivering t-shirt snow"},
        {"question": "평생 혼밥 vs 평생 회식?", "option_a": "평생 혼밥", "keyword_a": "eating alone peaceful solo", "option_b": "평생 회식", "keyword_b": "drinking party noisy toast"},
        {"question": "일 잘하는데 성격 개차반 vs 일 못하는데 천사?", "option_a": "일잘러 싸가지", "keyword_a": "angry boss shouting work", "option_b": "일못러 천사", "keyword_b": "clumsy kind smiling sorry"},
        {"question": "월요일 아침 vs 일요일 저녁?", "option_a": "월요일 아침(시작)", "keyword_a": "monday morning alarm coffee", "option_b": "일요일 저녁(끝)", "keyword_b": "sunday evening sunset sad"},
        {"question": "산 vs 바다?", "option_a": "산(등산)", "keyword_a": "mountain hiking peak green", "option_b": "바다(수영)", "keyword_b": "ocean beach blue wave"},
        {"question": "개 vs 고양이?", "option_a": "개(강아지)", "keyword_a": "cute puppy dog running", "option_b": "고양이", "keyword_b": "cute cat kitten sleeping"},
        {"question": "아침형 인간 vs 저녁형 인간?", "option_a": "아침형", "keyword_a": "sunrise morning yoga coffee", "option_b": "저녁형", "keyword_b": "moonlight night owl laptop"},
        {"question": "집순이/집돌이 vs 밖순이/밖돌이?", "option_a": "집이 최고", "keyword_a": "home bed blanket netflix", "option_b": "밖이 최고", "keyword_b": "travel camping outside party"},
        {"question": "매운맛(불닭) vs 느끼한맛(까르보)?", "option_a": "매운맛", "keyword_a": "spicy red pepper fire", "option_b": "느끼한맛", "keyword_b": "creamy cheese butter pasta"},
        {"question": "한식 vs 양식?", "option_a": "한식", "keyword_a": "korean food bibimbap", "option_b": "양식", "keyword_b": "steak pasta pizza western"},
        {"question": "콜라 vs 사이다?", "option_a": "콜라", "keyword_a": "coke cola soda glass", "option_b": "사이다", "keyword_b": "sprite clear soda bubbles"},
        {"question": "영화관 vs 넷플릭스?", "option_a": "영화관", "keyword_a": "cinema popcorn big screen", "option_b": "집에서 넷플", "keyword_b": "sofa tv streaming home"},
        {"question": "아이언맨 vs 캡틴 아메리카?", "option_a": "아이언맨", "keyword_a": "ironman suit robot red", "option_b": "캡틴", "keyword_b": "captain america shield blue"},
        {"question": "배트맨 vs 슈퍼맨?", "option_a": "배트맨", "keyword_a": "batman dark knight gotham", "option_b": "슈퍼맨", "keyword_b": "superman flying cape red"},
        {"question": "해리포터 vs 반지의 제왕?", "option_a": "해리포터", "keyword_a": "harry potter magic wand", "option_b": "반지의 제왕", "keyword_b": "lord of the rings ring fantasy"},
        {"question": "축구 vs 야구?", "option_a": "축구", "keyword_a": "soccer ball stadium goal", "option_b": "야구", "keyword_b": "baseball bat glove game"},
        {"question": "나이키 vs 아디다스?", "option_a": "나이키", "keyword_a": "nike swoosh shoes sport", "option_b": "아디다스", "keyword_b": "adidas stripes track suit"},
        {"question": "벤츠 vs BMW?", "option_a": "벤츠", "keyword_a": "mercedes benz luxury car", "option_b": "BMW", "keyword_b": "bmw sport car driving"},
        {"question": "유재석 vs 강호동?", "option_a": "유재석(유느님)", "keyword_a": "mc yoo jae suk glasses", "option_b": "강호동(호동좌)", "keyword_b": "kang ho dong wrestling energy"},
        {"question": "손흥민 vs 메시?", "option_a": "손흥민", "keyword_a": "son heung min soccer goal", "option_b": "메시", "keyword_b": "lionel messi soccer legend"},
        {"question": "리그 오브 레전드 vs 배틀그라운드?", "option_a": "롤(LoL)", "keyword_a": "league of legends game", "option_b": "배그(PUBG)", "keyword_b": "pubg battlegrounds gun"},
        {"question": "스타크래프트 vs 워크래프트?", "option_a": "스타크래프트", "keyword_a": "starcraft marine zerg", "option_b": "워크래프트", "keyword_b": "warcraft orc human game"},
        {"question": "유튜브 하기 vs 인스타 하기?", "option_a": "유튜브(영상)", "keyword_a": "youtube creator camera video", "option_b": "인스타(사진)", "keyword_b": "instagram influencer selfie"},
        {"question": "틱톡 찍기 vs 릴스 찍기?", "option_a": "틱톡", "keyword_a": "tiktok dance challenge app", "option_b": "릴스", "keyword_b": "reels instagram video short"},
        {"question": "카카오페이 vs 토스?", "option_a": "카카오페이", "keyword_a": "kakaopay yellow payment", "option_b": "토스", "keyword_b": "toss blue money finance"},
        {"question": "배달의민족 vs 쿠팡이츠?", "option_a": "배민", "keyword_a": "baemin rider motorcycle delivery", "option_b": "쿠팡이츠", "keyword_b": "coupang eats rocket fast"},
        {"question": "당근마켓 vs 중고나라?", "option_a": "당근", "keyword_a": "karrot market neighborhood", "option_b": "중고나라", "keyword_b": "joonggonara forum box"},
        {"question": "비트코인 vs 주식?", "option_a": "코인(한방)", "keyword_a": "bitcoin crypto chart rocket", "option_b": "주식(우량주)", "keyword_b": "stock market graph wall street"},
        {"question": "건물주 vs 대기업 임원?", "option_a": "건물주(불로소득)", "keyword_a": "building owner key money", "option_b": "임원(명예)", "keyword_b": "executive ceo suit meeting"},
        {"question": "로또 1등 vs 연금복권 1등?", "option_a": "로또(일시불)", "keyword_a": "lottery winner money cash", "option_b": "연금(월지급)", "keyword_b": "pension monthly income safe"}
    ]

    print(f"🌱 총 {len(initial_data)}개의 밸런스 게임 질문을 심습니다...")

    # DB에 삽입 (카운트는 모두 0으로 초기화)
    for item in initial_data:
        game = BalanceGame(
            question=item["question"],
            option_a=item["option_a"],
            option_b=item["option_b"],
            keyword_a=item["keyword_a"],
            keyword_b=item["keyword_b"],
            count_a=0,
            count_b=0
        )
        db.add(game)

    db.commit()
    db.close()
    print("✅ 100개 데이터 저장 완료! (DB 초기화 됨)")

if __name__ == "__main__":
    seed_data()
