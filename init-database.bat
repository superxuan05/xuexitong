@echo off
chcp 65001 >nul
title 初始化智签数据库
cls

echo ==========================================
echo        智签系统数据库初始化
echo ==========================================
echo.

color 0A

:: 检查 MySQL 是否安装
mysql --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未检测到 MySQL，请先运行 install-mysql.bat 安装
    pause
    exit /b 1
)

echo [INFO] 检测到 MySQL 已安装
echo.

:: 检查 MySQL 服务是否运行
net start | find "MySQL" >nul
if errorlevel 1 (
    echo [INFO] 正在启动 MySQL 服务...
    net start MySQL80 >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] 无法启动 MySQL 服务
        pause
        exit /b 1
    )
    echo [OK] MySQL 服务已启动
) else (
    echo [OK] MySQL 服务正在运行
)
echo.

:: 获取脚本所在目录
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

:: 检查 SQL 文件
if not exist "database\init.sql" (
    echo [ERROR] 未找到 database\init.sql 文件
    pause
    exit /b 1
)

echo [INFO] 正在初始化数据库...
echo [INFO] 使用 root 用户，密码: 123456
echo.

:: 执行 SQL 脚本
mysql -u root -p123456 < database\init.sql

if errorlevel 1 (
    echo.
    echo [ERROR] 数据库初始化失败
    echo [INFO] 可能原因:
    echo   1. root 密码不是 123456
    echo   2. MySQL 服务未启动
    echo   3. 端口 3306 被占用
    echo.
    echo [INFO] 请检查并重试，或手动导入 database\init.sql
    pause
    exit /b 1
)

echo.
echo ==========================================
echo        数据库初始化成功！
echo ==========================================
echo.
echo [INFO] 数据库: xuexitong
echo [INFO] 用户名: xuexitong
echo [INFO] 密码: 123456
echo.
echo 测试账号:
echo   - 教师: T2021001 / 123456
echo   - 学生: 2021001001 / 123456
echo.
pause