@echo off
title VoiceChat Mini 停止器

echo 停止 VoiceChat Mini 服务...
echo.

:: 停止端口占用的进程
echo 清理端口占用...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001 " 2^>nul') do (
    echo 停止端口 3001 进程 %%p
    taskkill /PID %%p /F >nul 2>&1
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " 2^>nul') do (
    echo 停止端口 3000 进程 %%p
    taskkill /PID %%p /F >nul 2>&1
)

:: 强制停止相关进程
echo 清理相关进程...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1

:: 等待清理完成
timeout /t 2 >nul

echo.
echo 所有服务已停止
pause
