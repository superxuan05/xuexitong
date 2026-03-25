@echo off
chcp 65001 >nul
title 智签系统一键启动
cls

echo ==========================================
echo        智签系统一键启动脚本
echo ==========================================
echo.

:: 设置颜色
color 0A

:: 获取当前目录
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

echo [INFO] 工作目录: %BASE_DIR%
echo.

:: ==========================================
:: 1. 启动数据库 (Docker)
:: ==========================================
echo [1/3] 正在启动 MySQL 数据库...
echo ------------------------------------------

cd database

:: 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未运行，请先启动 Docker Desktop
    echo.
    pause
    exit /b 1
)

:: 启动数据库容器
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] 数据库启动失败
    cd ..
    pause
    exit /b 1
)

echo [OK] 数据库启动成功
echo [INFO] MySQL 端口: 3306
echo [INFO] phpMyAdmin: http://localhost:8080
echo.

cd ..

:: 等待数据库初始化
echo [INFO] 等待数据库初始化 (5秒)...
timeout /t 5 /nobreak >nul
echo.

:: ==========================================
:: 2. 启动后端服务
:: ==========================================
echo [2/3] 正在启动后端服务...
echo ------------------------------------------

cd server

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [INFO] 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo [OK] 依赖安装完成
)

:: 启动后端服务
echo [INFO] 正在启动 Node.js 服务...
start "智签后端服务" cmd /k "npm run dev"

echo [OK] 后端服务启动成功
echo [INFO] API 地址: http://localhost:3000
echo.

cd ..

:: 等待后端启动
echo [INFO] 等待后端服务启动 (3秒)...
timeout /t 3 /nobreak >nul
echo.

:: ==========================================
:: 3. 启动前端服务
:: ==========================================
echo [3/3] 正在启动前端服务...
echo ------------------------------------------

cd xuexitong

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [INFO] 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo [OK] 依赖安装完成
)

:: 启动前端服务
echo [INFO] 正在启动 Vue 开发服务器...
start "智签前端服务" cmd /k "npm run dev"

echo [OK] 前端服务启动成功
echo [INFO] 前端地址: http://localhost:5173
echo.

cd ..

:: ==========================================
:: 启动完成
:: ==========================================
color 0E
echo ==========================================
echo        所有服务启动成功！
echo ==========================================
echo.
echo 服务访问地址:
echo   - 前端页面: http://localhost:5173
echo   - 后端 API: http://localhost:3000
echo   - 数据库管理: http://localhost:8080
echo.
echo 测试账号:
echo   - 教师: T2021001 / 123456
echo   - 学生: 2021001001 / 123456
echo.
echo 按任意键关闭所有服务...
echo.

pause >nul

:: ==========================================
:: 关闭所有服务
:: ==========================================
echo.
echo [INFO] 正在关闭所有服务...
echo.

:: 关闭前端服务
taskkill /FI "WINDOWTITLE eq 智签前端服务*" /F >nul 2>&1
echo [OK] 前端服务已关闭

:: 关闭后端服务
taskkill /FI "WINDOWTITLE eq 智签后端服务*" /F >nul 2>&1
echo [OK] 后端服务已关闭

:: 关闭数据库
cd database
docker-compose down >nul 2>&1
cd ..
echo [OK] 数据库已关闭

echo.
echo [INFO] 所有服务已关闭
echo.

color 07
pause