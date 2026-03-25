@echo off
chcp 65001 >nul
title 智签系统 - 仅启动前端
cls

echo ==========================================
echo        智签系统前端启动脚本
echo ==========================================
echo.

color 0A
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

echo [INFO] 工作目录: %BASE_DIR%
echo.

cd xuexitong

:: 检查 node_modules
if not exist "node_modules" (
    echo [INFO] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo [OK] 依赖安装完成
    echo.
)

echo [INFO] 正在启动前端开发服务器...
echo ------------------------------------------
start "智签前端服务" cmd /k "npm run dev"

echo.
echo [OK] 前端服务启动成功！
echo [INFO] 访问地址: http://localhost:5173
echo.

cd ..

color 0E
echo ==========================================
echo        前端启动成功！
echo ==========================================
echo.
pause

:: 关闭
taskkill /FI "WINDOWTITLE eq 智签前端服务*" /F >nul 2>&1
echo [OK] 前端服务已关闭
pause