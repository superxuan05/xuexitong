@echo off
chcp 65001 >nul
title 智签系统 - 关闭所有服务
cls

echo ==========================================
echo        智签系统服务关闭脚本
echo ==========================================
echo.

color 0C
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

echo [INFO] 正在关闭所有服务...
echo.

:: 关闭前端
echo [1/3] 关闭前端服务...
taskkill /FI "WINDOWTITLE eq 智签前端服务*" /F >nul 2>&1
if errorlevel 1 (
    echo [INFO] 前端服务未运行
) else (
    echo [OK] 前端服务已关闭
)

:: 关闭后端
echo [2/3] 关闭后端服务...
taskkill /FI "WINDOWTITLE eq 智签后端服务*" /F >nul 2>&1
if errorlevel 1 (
    echo [INFO] 后端服务未运行
) else (
    echo [OK] 后端服务已关闭
)

:: 关闭数据库
echo [3/3] 关闭数据库...
cd database
docker-compose down >nul 2>&1
if errorlevel 1 (
    echo [INFO] 数据库未运行
) else (
    echo [OK] 数据库已关闭
)
cd ..

echo.
color 0A
echo ==========================================
echo        所有服务已关闭！
echo ==========================================
echo.
pause