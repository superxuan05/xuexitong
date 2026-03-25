@echo off
chcp 65001 >nul
title 智签系统一键启动（本地MySQL版）
cls

echo ==========================================
echo     智签系统一键启动脚本（本地版）
echo ==========================================
echo.

color 0A

:: 获取当前目录
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

echo [INFO] 工作目录: %BASE_DIR%
echo.

:: 检查 MySQL
mysql --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未检测到 MySQL！
    echo.
    echo 请按以下步骤操作:
    echo   1. 运行 install-mysql.bat 安装 MySQL
    echo   2. 运行 init-database.bat 初始化数据库
    echo   3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo [OK] MySQL 已安装

:: 检查 MySQL 服务
net start | find "MySQL" >nul
if errorlevel 1 (
    echo [INFO] 正在启动 MySQL 服务...
    net start MySQL80 >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] 无法启动 MySQL 服务
        pause
        exit /b 1
    )
)
echo [OK] MySQL 服务正在运行
echo.

:: ==========================================
:: 1. 启动后端服务
:: ==========================================
echo [1/3] 正在启动后端服务...
echo ------------------------------------------

cd server

:: 检查 node_modules
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

:: 启动后端
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
:: 2. 启动前端服务
:: ==========================================
echo [2/3] 正在启动前端服务...
echo ------------------------------------------

cd xuexitong

:: 检查 node_modules
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

:: 启动前端
echo [INFO] 正在启动 Vue 开发服务器...
start "智签前端服务" cmd /k "npm run dev"

echo [OK] 前端服务启动成功
echo [INFO] 前端地址: http://localhost:5173
echo.

cd ..

:: ==========================================
:: 3. 启动后台管理系统
:: ==========================================
echo [3/3] 正在启动后台管理系统...
echo ------------------------------------------

cd admin

:: 检查 node_modules
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

:: 启动后台管理
echo [INFO] 正在启动后台管理系统...
start "智签后台管理" cmd /k "npm run dev"

echo [OK] 后台管理系统启动成功
echo [INFO] 后台地址: http://localhost:5174
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
echo   - 前端页面:    http://localhost:5173
echo   - 后端 API:    http://localhost:3000
echo   - 后台管理:    http://localhost:5174
echo   - 数据库:      localhost:3306
echo.
echo 测试账号:
echo   - 教师: T2021001 / 123456
echo   - 学生: 2021001001 / 123456
echo   - 后台: admin / 123456
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

:: 关闭前端
taskkill /FI "WINDOWTITLE eq 智签前端服务*" /F >nul 2>&1
echo [OK] 前端服务已关闭

:: 关闭后台管理
taskkill /FI "WINDOWTITLE eq 智签后台管理*" /F >nul 2>&1
echo [OK] 后台管理系统已关闭

:: 关闭后端
taskkill /FI "WINDOWTITLE eq 智签后端服务*" /F >nul 2>&1
echo [OK] 后端服务已关闭

echo.
echo [INFO] 服务已关闭（MySQL 服务保持运行）
echo.

color 07
pause