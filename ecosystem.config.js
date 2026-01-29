module.exports = {
  apps: [
    {
      name: "murro-backend",
      cwd: "/home/murro/murro/backend", // 백엔드 폴더 위치
      script: "/home/murro/murro/backend/venv/bin/uvicorn", // 가상환경 내 uvicorn 실행 파일
      args: "main:app --host 0.0.0.0 --port 8080", // 실행 옵션
      interpreter: "none", // 파이썬 가상환경 바이너리를 직접 실행하므로 none
      autorestart: true, // 에러나면 자동 재시작
      watch: false, // 파일 변경 감지 끔 (운영 환경에서는 보통 끔)
    },
    {
      name: "murro-frontend",
      cwd: "/home/murro/murro/frontend", // 프론트엔드 폴더 위치
      script: "npm",
      args: "start", // 'npm start' 실행
      autorestart: true,
      env: {
        NODE_ENV: "production", // 배포 모드 설정
      },
    },
  ],
};
