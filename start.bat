@echo off
setlocal enabledelayedexpansion

echo 🚀 Inicializando sistema de Inventario Taller...

:: ----------------- BACKEND -----------------
cd backend

:: Verificar node_modules
if not exist "node_modules" (
  echo 📦 Instalando dependencias del backend...
  call npm install
)

:: Verificar cliente de Prisma
if not exist "node_modules\.prisma\client\query_engine-windows.dll.node" (
  echo 🗃️ Generando cliente Prisma...
  call npx prisma generate
)

:: Verificar migraciones
if not exist "prisma\migrations" (
  echo ⚙️ Ejecutando migración inicial de Prisma...
  call npx prisma migrate dev --name init
) else (
  echo 🛠️ Migraciones ya aplicadas.
)

echo ▶️ Iniciando backend...
start cmd /k "npm run dev"
cd ..

:: ----------------- FRONTEND -----------------
cd frontend

:: Verificar node_modules
if not exist "node_modules" (
  echo 📦 Instalando dependencias del frontend...
  call npm install
)

echo ▶️ Iniciando frontend...
call npm run dev
