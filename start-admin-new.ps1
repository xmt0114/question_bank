Write-Host "正在启动题库管理系统..." -ForegroundColor Green

# 启动后端服务
$backendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path './server'; npm run dev" -PassThru

# 等待3秒，确保后端服务已启动
Start-Sleep -Seconds 3

# 启动前端服务（管理员模式）
$frontendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -- --mode admin" -PassThru

Write-Host "题库管理系统已启动！" -ForegroundColor Green
Write-Host "前端地址: http://localhost:5173/settings" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:4000" -ForegroundColor Cyan

# 等待用户按下任意键后关闭脚本
Write-Host "按任意键退出脚本（不会关闭服务）..." -ForegroundColor Yellow
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
