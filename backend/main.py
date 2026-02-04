import asyncio
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from database import get_db, Base, engine, SessionLocal
from models import LottoDraw, Prediction, WinningStore, Notice, BalanceGame
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from schemas import PredictionCreate, PredictionResponse, NoticeCreate, NoticeResponse
from typing import List
from pydantic import BaseModel
from crawler import crawl_latest_lotto
from train_model import train
from predict import get_ai_prediction
from fortune import get_fortune_reading 
from store_crawler import crawl_past_winning_stores
from geocoder import update_store_coordinates
from menu import get_menu_recommendation
from datetime import datetime
from prometheus_fastapi_instrumentator import Instrumentator
# [수정] generate_game_data 대신 이미지 URL 변환 함수만 가져옴
from generator import get_image_url 
import random
from weather import get_kma_weather, get_current_address

Base.metadata.create_all(bind=engine)

# --- 스케줄러 작업 ---
async def weekly_update_job():
    print("⏰ [주간 작업] 1. 로또 당첨 번호 업데이트...")
    draw_result = await crawl_latest_lotto()
    if draw_result:
        print(f"✨ {draw_result['turn']}회차 확보! 크롤링 및 재학습 진행...")
        await crawl_past_winning_stores()
        await asyncio.to_thread(update_store_coordinates)
        await asyncio.to_thread(train)
        print("✅ [주간 작업 완료]")
    else:
        print("💤 최신 회차 없음.")

scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(weekly_update_job, 'cron', day_of_week='sat', hour=22, minute=0)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics"],
    inprogress_name="inprogress",
    inprogress_labels=True,
)
instrumentator.instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 기본 API ---
@app.get("/")
def read_root(): return {"message": "Murro AI Server Running"}

@app.get("/api/lotto/latest")
def get_latest_lotto(db: Session = Depends(get_db)):
    latest = db.query(LottoDraw).order_by(LottoDraw.turn.desc()).first()
    return latest if latest else {"message": "데이터 없음"}

@app.get("/api/lotto/predict")
def predict_lotto():
    result = get_ai_prediction()
    return {"predicted_numbers": result} if not isinstance(result, dict) or "error" not in result else result

@app.get("/api/lotto/{turn}")
async def get_lotto_by_turn(turn: int, db: Session = Depends(get_db)):
    return db.query(LottoDraw).filter(LottoDraw.turn == turn).first()

@app.post("/api/lotto/crawl")
async def run_crawler_manually():
    await weekly_update_job()
    return {"message": "수동 업데이트 시작"}

# --- 예측 및 명예의 전당 API ---
@app.post("/api/predictions")
async def create_prediction(pred: PredictionCreate, db: Session = Depends(get_db)):
    saved = []
    for nums in pred.games:
        new_p = Prediction(turn=pred.turn, p_num1=nums[0], p_num2=nums[1], p_num3=nums[2], p_num4=nums[3], p_num5=nums[4], p_num6=nums[5], username=pred.username)
        db.add(new_p)
        saved.append(new_p)
    db.commit()
    return {"message": "등록 성공", "count": len(saved)}

@app.get("/api/predictions/{turn}", response_model=List[PredictionResponse])
async def get_predictions(turn: int, db: Session = Depends(get_db)):
    lotto = db.query(LottoDraw).filter(LottoDraw.turn == turn).first()
    preds = db.query(Prediction).filter(Prediction.turn == turn).all()
    
    if lotto:
        win = {lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6}
        is_updated = False
        
        for p in preds:
            if p.rank == "대기중":
                my = {p.p_num1, p.p_num2, p.p_num3, p.p_num4, p.p_num5, p.p_num6}
                match = len(win & my)
                
                if match == 6: p.rank = "1등"
                elif match == 5 and lotto.bonus in my: p.rank = "2등"
                elif match == 5: p.rank = "3등"
                elif match == 4: p.rank = "4등"
                elif match == 3: p.rank = "5등"
                else: p.rank = "낙첨"
                
                is_updated = True
        
        if is_updated:
            db.commit()
            
    return preds

# --- 운세 API ---
class FortuneRequest(BaseModel):
    birthDate: str; birthTime: str; gender: str
@app.post("/api/fortune")
async def read_fortune(req: FortuneRequest):
    return await get_fortune_reading(req.birthDate, req.birthTime, req.gender)

# --- 명당 랭킹 API ---
@app.get("/api/stores/top")
def get_top_stores(db: Session = Depends(get_db)):
    results = db.query(
        WinningStore.store_name,
        WinningStore.address,
        WinningStore.lat,
        WinningStore.lng,
        func.sum(case((WinningStore.rank == 1, 1), else_=0)).label('first_count'),
        func.sum(case((WinningStore.rank == 2, 1), else_=0)).label('second_count')
    ).group_by(
        WinningStore.store_name, 
        WinningStore.address, 
        WinningStore.lat, 
        WinningStore.lng
    ).order_by(
        desc('first_count'), 
        desc('second_count')
    ).limit(100).all()

    return [{
        "store_name": r.store_name,
        "address": r.address,
        "lat": r.lat if r.lat else 0.0,
        "lng": r.lng if r.lng else 0.0,
        "1st": int(r.first_count or 0),
        "2nd": int(r.second_count or 0)
    } for r in results]

@app.get("/api/stores/all")
def get_all_map_stores(db: Session = Depends(get_db)):
    results = db.query(
        WinningStore.store_name,
        WinningStore.lat,
        WinningStore.lng,
        func.sum(case((WinningStore.rank == 1, 1), else_=0)).label('first_count'),
        func.sum(case((WinningStore.rank == 2, 1), else_=0)).label('second_count')
    ).filter(
        WinningStore.lat != None
    ).group_by(
        WinningStore.store_name,
        WinningStore.lat,
        WinningStore.lng
    ).all()

    return [{
        "name": r.store_name,
        "lat": r.lat,
        "lng": r.lng,
        "first_count": int(r.first_count or 0),
        "second_count": int(r.second_count or 0)
    } for r in results]

# 메뉴 추천
class MenuRequest(BaseModel):
    lat: float
    lng: float

@app.post("/api/menu/recommend")
async def recommend_menu(req: MenuRequest):
    now_str = datetime.now().strftime("%H시 %M분")
    result = await get_menu_recommendation(req.lat, req.lng, now_str)
    return result    

# --- 공지사항 API ---
@app.get("/api/notices", response_model=List[NoticeResponse])
def get_notices(db: Session = Depends(get_db)):
    return db.query(Notice)\
        .filter(Notice.is_active == 1)\
        .order_by(Notice.created_at.desc())\
        .all()

@app.post("/api/notices", response_model=NoticeResponse)
def create_notice(notice: NoticeCreate, db: Session = Depends(get_db)):
    new_notice = Notice(title=notice.title, content=notice.content)
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)
    return new_notice

@app.delete("/api/notices/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    target = db.query(Notice).filter(Notice.id == notice_id).first()
    if target:
        db.delete(target)
        db.commit()
        return {"message": "삭제되었습니다."}
    return {"error": "존재하지 않는 글입니다."}

# --- [수정 완료] 밸런스 게임 API (DB 기반 랜덤 픽) ---

@app.get("/api/balance/next")
def get_next_balance_game(db: Session = Depends(get_db)):
    """
    DB에서 랜덤으로 1개를 뽑아 즉시 반환 (속도 0.1초)
    """
    # 1. 랜덤 정렬로 하나 추출
    game = db.query(BalanceGame).order_by(func.random()).first()
    
    # 2. 만약 DB가 비어있다면 에러 반환 (seed.py 실행 유도)
    if not game:
        return {
            "error": "질문 데이터가 없습니다. 서버 관리자에게 'seed.py' 실행을 요청하세요.",
            "question": "데이터 준비 중...",
            "option_a": "잠시만",
            "option_b": "기다려주세요"
        }

    # 3. DB에 저장된 영문 키워드(keyword_a/b)를 이용해 실제 이미지 URL 검색
    # (Unsplash 검색은 빠르지만, 이것도 느리면 img_a/b 컬럼에 URL을 미리 박아두는 방법도 있음)
    img_a = get_image_url(game.keyword_a)
    img_b = get_image_url(game.keyword_b)
    
    return {
        "id": game.id,
        "question": game.question,
        "option_a": game.option_a,
        "img_a": img_a,
        "option_b": game.option_b,
        "img_b": img_b
    }

@app.post("/api/balance/{game_id}/vote")
def vote_balance_game(game_id: int, choice: str, db: Session = Depends(get_db)):
    game = db.query(BalanceGame).filter(BalanceGame.id == game_id).first()
    if not game: return {"error": "Game not found"}
    
    if choice == 'A': game.count_a += 1
    elif choice == 'B': game.count_b += 1
    
    db.commit()
    
    # 결과 계산
    total = game.count_a + game.count_b
    per_a = int((game.count_a / total) * 100) if total > 0 else 50
    
    return {
        "percent_a": per_a,
        "percent_b": 100 - per_a,
        "count_a": game.count_a,
        "count_b": game.count_b
    }

@app.get("/api/weather/current")
async def get_today_weather(lat: float, lng: float):
    # 1. 날씨 조회
    weather = get_kma_weather(lat, lng)
    
    # 2. 주소 조회 (Kakao API)
    address = get_current_address(lat, lng)

    if not weather:
        return {"error": "기상청 정보를 불러올 수 없습니다."}
    
    # 강수 코드 변환
    pty_code = int(weather.get("PTY", 0))
    pty_desc = {0: "맑음", 1: "비", 2: "비/눈", 3: "눈", 4: "소나기"}.get(pty_code, "정보 없음")
    
    return {
        "address": address,                # [추가] 주소 정보 (예: 서울 강남구 역삼동)
        "temp": weather.get("T1H"),        
        "humidity": weather.get("REH"),    
        "wind": weather.get("WSD"),        
        "condition": pty_desc
    }