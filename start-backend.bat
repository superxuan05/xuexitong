@echo off
chcp 65001 >nul
title 智签系统 - 仅启动后端和数据库
cls

echo ==========================================
echo      智签系统后端+数据库启动脚本
echo ==========================================
echo.

color 0A
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

echo [INFO] 工作目录: %BASE_DIR%
echo.

:: ==========================================
:: 1. 启动数据库
:: ==========================================
echo [1/2] 正在启动 MySQL 数据库...
echo ------------------------------------------

cd database

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

docker-compose up -d
if errorlevel 1 (
    echo [ERROR] 数据库启动失败
    cd ..
    pause
    exit /b 1
)

echo [OK] 数据库启动成功
echo [INFO] MySQL: localhost:3306
echo [INFO] phpMyAdmin: http://localhost:8080
echo.

cd ..
timeout /t 3 /nobreak >nul

:: ==========================================
:: 2. 启动后端
:: ==========================================
echo [2/2] 正在启动后端服务...
echo ------------------------------------------

cd server

if not exist "node_modules" (
    echo [INFO] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
)

echo [INFO] 启动 Node.js 服务...
start "智签后端服务" cmd /k "npm run dev"

echo [OK] 后端服务启动成功
echo [INFO] API: http://localhost:3000
echo.

cd ..

color 0E
echo ==========================================
echo      后端和数据库启动成功！
echo ==========================================
echo.
echo 服务地址:
echo   - API: http://localhost:3000
echo   - 数据库: localhost:3306
echo   - phpMyAdmin: http://localhost:8080
echo.
pause

:: 关闭
taskkill /FI "WINDOWTITLE eq 智签后端服务*" /F >nul 2>&1
cd database
docker-compose down >nul 2>&1
cd ..
echo [OK] 服务已关闭
pause