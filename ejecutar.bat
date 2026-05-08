@echo off
title QuindioFlix
echo ====================================
echo   QuindioFlix - Streaming Colombiano
echo ====================================
echo.

cd /d "frontend"

echo [1/2] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo Error al instalar dependencias
    pause
    exit /b %errorlevel%
)

echo [2/2] Iniciando servidor de desarrollo...
echo.
echo Abre tu navegador en: http://localhost:3000
echo.
start http://localhost:3000
npm run dev

pause
