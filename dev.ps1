# 启动脚本 - 用 node 完整路径，跳过 cmd PATH
$root = $PSScriptRoot
$node = "C:\Program Files\nodejs\node.exe"

Write-Host "═══ 正在启动 web3-mall ═══" -ForegroundColor Cyan

# 开新窗口启动 API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$node' '$root\apps\api\node_modules\@nestjs\cli\bin\nest.js' start --watch"
Start-Sleep 2

# 开新窗口启动 Web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$node' '$root\apps\web\node_modules\next\dist\bin\next' dev -p 3000"

Write-Host "已打开两个 PowerShell 窗口：" -ForegroundColor Green
Write-Host "  · API → http://localhost:3001" -ForegroundColor Green
Write-Host "  · Web → http://localhost:3000" -ForegroundColor Green
Write-Host "关掉窗口即可停止`n" -ForegroundColor Yellow
