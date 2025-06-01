@echo off
setlocal enabledelayedexpansion

echo 🚀 Inicializando sistema de Inventario Taller...

:: ----------------- INTENTAR DETECTAR PSQL -----------------
where psql >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ No se encontró 'psql' en el PATH. Buscando en ubicaciones típicas...

  :: Buscar en C:\Program Files\PostgreSQL\*\bin
  for /d %%F in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%F\bin\psql.exe" (
      set "psql_path=%%F\bin"
      echo ➕ Agregando 'psql' desde: !psql_path!
      set "PATH=!psql_path!;%PATH%"
      goto :check_psql
    )
  )

  echo ❌ No se encontró 'psql'. Asegurate de que PostgreSQL esté instalado y que el binario esté en el PATH.
  pause
  exit /b
)

:check_psql
:: ----------------- PEDIR CREDENCIALES Y PROBAR CONEXION -----------------
set PGUSER=postgres
set /p PGPASSWORD=🔑 Ingresá la contraseña del usuario "postgres": 

:: Validar conexión
psql -U %PGUSER% -d postgres -c "\q" >nul 2>nul
if %errorlevel% neq 0 (
  echo ❌ No se pudo conectar a PostgreSQL. Verificá usuario y contraseña.
  pause
  exit /b
)

:: Verificar si existe la base 'inventario'
echo 🔍 Verificando si existe la base de datos 'inventario'...
psql -U %PGUSER% -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'inventario';" | findstr 1 >nul
if %errorlevel% neq 0 (
  echo 🛠️ La base de datos 'inventario' no existe. Creándola...
  psql -U %PGUSER% -d postgres -c "CREATE DATABASE inventario;"
) else (
  echo ✅ La base de datos 'inventario' ya existe.
)

:: ----------------- BACKEND -----------------
cd backend

if not exist "node_modules" (
  echo 📦 Instalando dependencias del backend...
  call npm install
)

echo 🗃️ Generando cliente Prisma...
call npx prisma generate

echo ⚙️ Ejecutando migraciones de Prisma...
call npx prisma migrate dev --name init

echo ▶️ Iniciando backend...
start cmd /k "npm run dev"
cd ..

:: ----------------- FRONTEND -----------------
cd frontend

if not exist "node_modules" (
  echo 📦 Instalando dependencias del frontend...
  call npm install
)

call npm list @heroicons/react >nul 2>nul
if %errorlevel% neq 0 (
  echo 🎨 Instalando Heroicons...
  call npm install @heroicons/react
)

call npm list axios >nul 2>nul
if %errorlevel% neq 0 (
  echo 🔌 Instalando Axios...
  call npm install axios
)

echo ▶️ Iniciando frontend...
call npm run dev

endlocal
