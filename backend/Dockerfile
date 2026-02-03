# 1. Playwright 공식 이미지 사용 (브라우저 의존성 해결)
FROM ghcr.io/team-murro/murro-labs/backend-base:v1-gpu

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. Timezone 설정 (로그 시간 KST로 맞추기 위해 필수)
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 4. 의존성 파일 복사 및 설치
# (requirements.txt가 없으면 제가 분석한 라이브러리로 자동 생성 명령어를 넣습니다)
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# 5. 소스코드 전체 복사
COPY . .

# 6. 실행 명령어 (Uvicorn)
# K8s에서는 포트를 8000으로 통일하는 게 관리하기 편합니다.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
