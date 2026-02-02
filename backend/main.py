# backend/main.py
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
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
from generator import generate_game_data
import random

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

# backend/main.py 의 get_predictions 함수 교체

@app.get("/api/predictions/{turn}", response_model=List[PredictionResponse])
async def get_predictions(turn: int, db: Session = Depends(get_db)):
    # 1. 해당 회차 당첨 번호 조회
    lotto = db.query(LottoDraw).filter(LottoDraw.turn == turn).first()
    
    # 2. 해당 회차의 예측 기록 조회
    preds = db.query(Prediction).filter(Prediction.turn == turn).all()
    
    # 3. 당첨 번호가 발표된 경우에만 채점 로직 수행
    if lotto:
        win = {lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6}
        
        # 변경사항이 있는지 추적하는 플래그
        is_updated = False
        
        for p in preds:
            # [최적화] 이미 등수가 매겨진(1등~5등, 낙첨) 건은 계산 건너뜀! 
            # '대기중'인 것만 계산
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
        
        # 변경된 게 있을 때만 DB 저장 (속도 향상)
        if is_updated:
            db.commit()
            
    return preds

# --- 운세 API ---
class FortuneRequest(BaseModel):
    birthDate: str; birthTime: str; gender: str
@app.post("/api/fortune")
async def read_fortune(req: FortuneRequest):
    return await get_fortune_reading(req.birthDate, req.birthTime, req.gender)

# --- [수정 완료] 명당 랭킹 API ---
@app.get("/api/stores/top")
def get_top_stores(db: Session = Depends(get_db)):
    # 1. 좌표(lat) 필터 제거 -> 좌표 변환 안 된 데이터도 랭킹엔 나와야 함
    # 2. 정확한 집계 (count logic)
    results = db.query(
        WinningStore.store_name,
        WinningStore.address,
        WinningStore.lat,
        WinningStore.lng,
        # rank가 1이면 1을 더함 (횟수 집계)
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
        "lat": r.lat if r.lat else 0.0, # 좌표 없으면 0.0으로 처리 (지도 이동 시 예외처리 필요)
        "lng": r.lng if r.lng else 0.0,
        "1st": int(r.first_count or 0),
        "2nd": int(r.second_count or 0)
    } for r in results]

@app.get("/api/stores/all")
def get_all_map_stores(db: Session = Depends(get_db)):
    """
    지도 표시용 API (수정됨)
    - 기존: 당첨 내역을 그대로 리턴 (핀이 여러 개 겹침, 통계 안 됨)
    - 변경: 가게별로 그룹화하여 1등/2등 횟수를 집계해서 리턴 (핀 1개, 통계 포함)
    """
    # 좌표가 있는 데이터만 대상으로 가게별 그룹화 수행
    results = db.query(
        WinningStore.store_name,
        WinningStore.lat,
        WinningStore.lng,
        # 1등 횟수 집계
        func.sum(case((WinningStore.rank == 1, 1), else_=0)).label('first_count'),
        # 2등 횟수 집계
        func.sum(case((WinningStore.rank == 2, 1), else_=0)).label('second_count')
    ).filter(
        WinningStore.lat != None
    ).group_by(
        WinningStore.store_name,
        WinningStore.lat,
        WinningStore.lng
    ).all()

    # JSON 변환
    return [{
        "name": r.store_name,
        "lat": r.lat,
        "lng": r.lng,
        "first_count": int(r.first_count or 0),
        "second_count": int(r.second_count or 0)
    } for r in results]

# 메뉴 추천 요청 스키마
class MenuRequest(BaseModel):
    lat: float
    lng: float

@app.post("/api/menu/recommend")
async def recommend_menu(req: MenuRequest):
    now_str = datetime.now().strftime("%H시 %M분")
    result = await get_menu_recommendation(req.lat, req.lng, now_str)
    return result    

# 1. 공지사항 목록 조회 (최신순)
@app.get("/api/notices", response_model=List[NoticeResponse])
def get_notices(db: Session = Depends(get_db)):
    return db.query(Notice)\
        .filter(Notice.is_active == 1)\
        .order_by(Notice.created_at.desc())\
        .all()

# 2. 공지사항 작성
@app.post("/api/notices", response_model=NoticeResponse)
def create_notice(notice: NoticeCreate, db: Session = Depends(get_db)):
    new_notice = Notice(
        title=notice.title,
        content=notice.content
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)
    return new_notice

# 3. 공지사항 삭제
@app.delete("/api/notices/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    target = db.query(Notice).filter(Notice.id == notice_id).first()
    if target:
        # 실제 삭제 대신 '숨김 처리'를 하려면 아래 줄 주석 해제
        # target.is_active = 0 
        db.delete(target) # 완전 삭제
        db.commit()
        return {"message": "삭제되었습니다."}
    return {"error": "존재하지 않는 글입니다."}

# --- [신규] 밸런스 게임 API (Prefetching 적용) ---

def bg_generate_task():
    """백그라운드에서 실행될 AI 생성 작업"""
    # 백그라운드 작업은 별도의 DB 세션을 열어야 안전합니다.
    db = SessionLocal() 
    try:
        data = generate_game_data()
        if data:
            new_game = BalanceGame(**data)
            db.add(new_game)
            db.commit()
            print(f"✅ [Background] 새 게임 생성 완료: {data['question']}")
    except Exception as e:
        print(f"❌ [Background] 생성 실패: {e}")
    finally:
        db.close()

@app.get("/api/balance/next")
def get_next_balance_game(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. DB에 있는 게임 수 확인
    count = db.query(BalanceGame).count()
    
    # 2. 게임이 하나도 없으면? (최초 실행 시) -> 기다렸다가 만들어서 줌
    if count == 0:
        data = generate_game_data()
        if not data: return {"error": "AI가 응답하지 않습니다."}
        
        first_game = BalanceGame(**data)
        db.add(first_game)
        db.commit()
        
        # 나가는 길에 하나 더 만들어두라고 시킴 (다음 사람을 위해)
        background_tasks.add_task(bg_generate_task)
        
        return first_game

    # 3. 게임이 있으면 -> 랜덤으로 하나 뽑아서 줌 (즉시 응답!)
    rand_offset = random.randint(0, count - 1)
    game = db.query(BalanceGame).offset(rand_offset).first()
    
    # 4. [핵심] DB에 게임이 100개 미만이면, 나가는 길에 하나 더 만들라고 예약함
    if count < 100:
        background_tasks.add_task(bg_generate_task)
        
    return game

@app.post("/api/balance/{game_id}/vote")
def vote_balance_game(game_id: int, choice: str, db: Session = Depends(get_db)):
    game = db.query(BalanceGame).filter(BalanceGame.id == game_id).first()
    if not game: return {"error": "Game not found"}
    
    if choice == 'A': game.count_a += 1
    elif choice == 'B': game.count_b += 1
    
    db.commit()
    
    # 결과 계산
    total = game.count_a + game.count_b
    per_a = int((game.count_a / total) * 100)
    
    return {
        "percent_a": per_a,
        "percent_b": 100 - per_a,
        "count_a": game.count_a,
        "count_b": game.count_b
    }