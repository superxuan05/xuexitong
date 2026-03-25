@echo off
chcp 65001 >nul
title 安装 MySQL 数据库
cls

echo ==========================================
echo        MySQL 数据库安装脚本
echo ==========================================
echo.

color 0A

:: 检查是否以管理员身份运行
net session >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 请以管理员身份运行此脚本！
    echo [INFO] 右键点击脚本，选择"以管理员身份运行"
    pause
    exit /b 1
)

echo [INFO] 开始下载 MySQL...
echo.

:: 创建下载目录
set "DOWNLOAD_DIR=%TEMP%\mysql-install"
mkdir "%DOWNLOAD_DIR%" 2>nul
cd /d "%DOWNLOAD_DIR%"

:: 下载 MySQL Installer
echo [1/4] 正在下载 MySQL Installer...
powershell -Command "Invoke-WebRequest -Uri 'https://dev.mysql.com/get/Downloads/MySQLInstaller/mysql-installer-community-8.0.35.0.msi' -OutFile 'mysql-installer.msi' -UseBasicParsing"

if errorlevel 1 (
    echo [ERROR] 下载失败，请手动下载安装
    echo [INFO] 下载地址: https://dev.mysql.com/downloads/installer/
    pause
    exit /b 1
)

echo [OK] 下载完成

:: 安装 MySQL
echo.
echo [2/4] 正在安装 MySQL...
echo [INFO] 安装过程可能需要几分钟，请耐心等待...
msiexec /i mysql-installer.msi /quiet /norestart

echo [OK] MySQL Installer 安装完成

:: 启动 MySQL 安装向导
echo.
echo [3/4] 启动 MySQL 配置向导...
echo [INFO] 请在安装向导中设置 root 密码为: 123456
echo.

"C:\Program Files (x86)\MySQL\MySQL Installer for Windows\MySQLInstallerConsole.exe" community install server;8.0;rootpass:123456

echo.
echo [OK] MySQL 安装完成

:: 配置环境变量
echo.
echo [4/4] 配置环境变量...

:: 查找 MySQL 安装路径
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin"
) else if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_PATH=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin"
)

if defined MYSQL_PATH (
    setx /M PATH "%PATH%;%MYSQL_PATH%"
    echo [OK] 环境变量配置完成
) else (
    echo [WARNING] 未找到 MySQL 安装路径，请手动配置环境变量
)

:: 启动 MySQL 服务
echo.
echo [INFO] 启动 MySQL 服务...
net start MySQL80 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 服务启动失败，请手动启动
    echo [INFO] 命令: net start MySQL80
) else (
    echo [OK] MySQL 服务已启动
)

:: 清理下载文件
cd /d "%~dp0"
rmdir /s /q "%DOWNLOAD_DIR%" 2>nul

echo.
echo ==========================================
echo        MySQL 安装完成！
echo ==========================================
echo.
echo [INFO] root 密码: 123456
echo [INFO] 端口: 3306
echo.
echo 下一步:
echo   1. 运行 init-database.bat 初始化数据库
echo   2. 运行 start-all.bat 启动所有服务
echo.
pause