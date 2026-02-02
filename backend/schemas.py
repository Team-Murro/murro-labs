from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# [핵심 변경] numbers -> games (이중 리스트)로 변경
class PredictionCreate(BaseModel):
    turn: int
    games: List[List[int]] 
    username: str = "익명"

# 응답용 스키마 (기존 유지)
class PredictionResponse(BaseModel):
    id: int
    turn: int
    p_num1: int
    p_num2: int
    p_num3: int
    p_num4: int
    p_num5: int
    p_num6: int
    username: str
    rank: str
    created_at: datetime

    class Config:
        from_attributes = True

# [추가] 공지사항 요청/응답 스키마
class NoticeCreate(BaseModel):
    title: str
    content: str

class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True
