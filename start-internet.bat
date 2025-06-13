@echo off
setlocal enabledelayedexpansion
echo 🚀 Iniciando sistema de Inventario Taller en modo online...

:: Backend
cd backend
echo 📦 Verificando e instalando dependencias del backend...
if not exist node_modules (
    call npm install
)
echo ▶️ Iniciando backend...
start "" cmd /k "npm run dev"
cd ..

:: Frontend
cd frontend
echo 📦 Verificando e instalando dependencias del frontend...
if not exist node_modules (
    call npm install
)
echo ▶️ Iniciando frontend...
start "" cmd /k "npm run dev"
cd ..

:: Esperar a que los servidores estén activos
echo 🔄 Esperando backend (3001)...
powershell -Command "while (-not (Test-NetConnection localhost -Port 3001).TcpTestSucceeded) { Start-Sleep -Milliseconds 500 }"
echo 🔄 Esperando frontend (5173)...
powershell -Command "while (-not (Test-NetConnection localhost -Port 5173).TcpTestSucceeded) { Start-Sleep -Milliseconds 500 }"

:: Iniciar túneles desde ngrok.yml
echo 🌐 Iniciando túneles Ngrok desde ngrok.yml...
start "" cmd /k "ngrok start --all"

echo.
echo ✅ Sistema iniciado. Consultá las URLs en http://localhost:4040 o en la terminal de Ngrok.
pause

