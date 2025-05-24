@echo off
echo 🚀 Inicializando sistema de Inventario Taller...

:: Backend
cd backend
echo 📦 Instalando dependencias del backend...
call npm install

echo 🗃️ Ejecutando Prisma...
call npx prisma generate
call npx prisma migrate dev --name init

echo ▶️ Iniciando backend...
start cmd /k "npm run dev"
cd ..

:: Frontend
cd frontend
echo 📦 Instalando dependencias del frontend...
call npm install

echo ▶️ Iniciando frontend...
call npm run dev