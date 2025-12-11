@echo off
echo Starting QuoteMaker...

start "QuoteMaker Backend" cmd /c "cd server && npm install && node src/index.js"
timeout /t 5 /nobreak >nul
start "QuoteMaker Frontend" cmd /c "cd client && npm install && npm run dev"

echo App started! backend at port 3000, frontend at port 5173.
pause
