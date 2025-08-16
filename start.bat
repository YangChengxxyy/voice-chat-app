@echo off
title VoiceChat Mini

echo 启动 VoiceChat Mini...
echo.

:: 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js 未安装
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

:: 安装依赖
if not exist "node_modules" (
    echo 安装依赖包...
    call npm install
    if errorlevel 1 (
        echo ERROR: 依赖安装失败
        pause
        exit /b 1
    )
)

:: 清理端口
echo 检查端口占用...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001 " 2^>nul') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " 2^>nul') do taskkill /PID %%p /F >nul 2>&1

:: 创建日志目录
if not exist "logs" mkdir logs

:: 启动服务
echo 启动 Socket.io 服务器...
start "Server" /min cmd /c "node server.js > logs\server.log 2>&1"
timeout /t 3 >nul

echo 启动 Next.js 服务器...
start "Client" cmd /c "npm run dev > logs\client.log 2>&1"
timeout /t 5 >nul

echo.
echo ===============================================
echo   VoiceChat Mini 已启动!
echo ===============================================
echo.
echo 应用地址: http://localhost:3000
echo 测试页面: http://localhost:3000/test
echo.
echo 提示: 关闭此窗口将停止所有服务
echo.

:: 打开浏览器
timeout /t 2 >nul
start http://localhost:3000

echo 按任意键停止服务...
pause >nul

:: 清理
echo 停止服务...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
echo 完成
pause
