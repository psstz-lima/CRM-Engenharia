@echo off
setlocal
for /f "delims=" %%i in ('git rev-parse --show-toplevel') do set ROOT=%%i
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (-not (Get-Command Invoke-ScriptAnalyzer -ErrorAction SilentlyContinue)) { exit 0 }; $paths = @(); if (Test-Path \"$env:ROOT\\scripts\\stop.ps1\") { $paths += \"$env:ROOT\\scripts\\stop.ps1\" }; if (Test-Path \"$env:ROOT\\scripts\\start.ps1\") { $paths += \"$env:ROOT\\scripts\\start.ps1\" }; if (-not $paths) { exit 0 }; $issues = Invoke-ScriptAnalyzer -Path $paths | Where-Object { $_.Severity -ne 'Information' }; if ($issues) { $issues | Format-Table -AutoSize | Out-String | Write-Host; Write-Host 'PSScriptAnalyzer encontrou problemas. Corrija antes de commitar.'; exit 1 }; exit 0"
endlocal
