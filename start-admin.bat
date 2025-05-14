@echo off
echo 正在启动题库管理系统...

REM 启动后端服务
start cmd /k "cd server && npm run dev"

REM 等待3秒，确保后端服务已启动
timeout /t 3 /nobreak

REM 启动前端服务（管理员模式）
start cmd /k "npm run dev -- --mode admin"

echo 题库管理系统已启动！
echo 前端地址: http://localhost:5173/settings
echo 后端地址: http://localhost:4000

pause
