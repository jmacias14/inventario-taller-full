@echo off
echo ▶️ Iniciando backend...
start cmd /k "cd backend && npm run dev"

echo ▶️ Iniciando frontend...
cd frontend
call npm run dev
