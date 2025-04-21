Write-Host "正在启动题库管理系统..." -ForegroundColor Green

# 启动后端服务
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./server; npm run dev"

# 等待3秒，确保后端服务已启动
Start-Sleep -Seconds 3

# 启动前端服务（管理员模式）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -- --mode admin"

Write-Host "题库管理系统已启动！" -ForegroundColor Green
Write-Host "前端地址: http://localhost:5173/settings" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:4000" -ForegroundColor Cyan
