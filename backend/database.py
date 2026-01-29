from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 아까 만든 계정 정보: postgresql://아이디:비번@주소/DB이름
DB_HOST = os.getenv("DB_HOST", "localhost")
SQLALCHEMY_DATABASE_URL = f"postgresql://murro_user:murro1234@{DB_HOST}/murro_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 의존성 주입용 함수 (API에서 DB 쓸 때 필요)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
