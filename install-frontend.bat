@echo off
echo 🚀 Instalando TODAS las dependencias necesarias para el frontend...

:: Ir a la carpeta del frontend
cd frontend

:: Instalar dependencias principales
call npm install react react-dom react-router-dom zustand axios

:: Instalar TailwindCSS y herramientas de procesamiento
call npm install -D tailwindcss postcss autoprefixer

:: Instalar Vite y plugin para React
call npm install -D vite @vitejs/plugin-react

echo ✅ Instalación completa.
echo ---------------------------------------------
echo Ahora podés ejecutar el proyecto con:
echo     npm run dev
echo ---------------------------------------------
pause