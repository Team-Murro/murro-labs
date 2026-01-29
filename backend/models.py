from sqlalchemy import Column, Integer, String, Date, DateTime, Float
from sqlalchemy.sql import func
from database import Base

class LottoDraw(Base):
    __tablename__ = "lotto_draws"

    turn = Column(Integer, primary_key=True, index=True)  # 회차 (예: 1100)
    draw_date = Column(Date)                              # 추첨일
    num1 = Column(Integer)
    num2 = Column(Integer)
    num3 = Column(Integer)
    num4 = Column(Integer)
    num5 = Column(Integer)
    num6 = Column(Integer)
    bonus = Column(Integer)
    
    # 데이터가 언제 수집됐는지 기록
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    turn = Column(Integer, index=True)  # 목표 회차 (예: 1153회)
    
    # 사용자가 뽑은 번호 6개
    p_num1 = Column(Integer)
    p_num2 = Column(Integer)
    p_num3 = Column(Integer)
    p_num4 = Column(Integer)
    p_num5 = Column(Integer)
    p_num6 = Column(Integer)
    
    username = Column(String, default="익명") # 사용자 닉네임 (나중에 로그인 붙이면 id로 변경)
    rank = Column(String, default="대기중")   # 결과 (1등, 2등, 꽝, 대기중)
    created_at = Column(DateTime(timezone=True), server_default=func.now())    

class WinningStore(Base):
    __tablename__ = "winning_stores"

    id = Column(Integer, primary_key=True, index=True)
    turn = Column(Integer, index=True)  # 회차 (예: 1206)
    rank = Column(Integer, index=True)  # 등수 (1 또는 2)
    store_name = Column(String)         # 판매점 이름 (예: 대박복권방)
    address = Column(String)            # 소재지 (주소)
    game_type = Column(String, nullable=True) # 구분 (자동/수동/반자동) - 1등만 존재할 수 있음
    
    # 나중에 카카오맵 연동을 위해 위도(lat), 경도(lng) 컬럼을 미리 만들어둡니다.
    # 처음 크롤링할 때는 비워두고(Null), 나중에 별도 작업으로 채울 예정입니다.
    lat = Column(Float, nullable=True) 
    lng = Column(Float, nullable=True)    
