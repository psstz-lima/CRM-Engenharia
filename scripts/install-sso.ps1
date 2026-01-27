# Script de instalacao/bootstrapping do modulo SSO
# Observacao: este repositorio ja possui estrutura; este script apenas garante pastas basicas.

chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "Iniciando bootstrap de pastas do CRM Engenharia (SSO)..." -ForegroundColor Cyan

Write-Host "" 
Write-Host "Criando/garantindo estrutura de pastas..." -ForegroundColor Yellow

$backendDirs = @(
    "backend\src\modules\auth\controllers",
    "backend\src\modules\auth\services",
    "backend\src\modules\auth\dto",
    "backend\src\modules\users\controllers",
    "backend\src\modules\users\services",
    "backend\src\modules\users\dto",
    "backend\src\modules\companies\controllers",
    "backend\src\modules\companies\services",
    "backend\src\modules\companies\dto",
    "backend\src\modules\permissions\controllers",
    "backend\src\modules\permissions\services",
    "backend\src\modules\permissions\dto",
    "backend\src\modules\notifications\controllers",
    "backend\src\modules\notifications\services",
    "backend\src\modules\audit\services",
    "backend\src\common\middlewares",
    "backend\src\common\guards",
    "backend\src\common\utils",
    "backend\src\config",
    "backend\src\database\migrations",
    "backend\src\database\seeds",
    "backend\prisma",
    "backend\tests",
    "backend\logs"
)

$frontendDirs = @(
    "frontend\src\pages\auth",
    "frontend\src\pages\profile",
    "frontend\src\pages\admin",
    "frontend\src\components\auth",
    "frontend\src\components\layout",
    "frontend\src\components\notifications",
    "frontend\src\components\common",
    "frontend\src\hooks",
    "frontend\src\services",
    "frontend\src\contexts",
    "frontend\src\utils",
    "frontend\src\types",
    "frontend\src\assets",
    "frontend\public"
)

foreach ($dir in $backendDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

foreach ($dir in $frontendDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "OK - Estrutura de pastas garantida." -ForegroundColor Green

Write-Host ""
Write-Host "Proximos passos sugeridos:" -ForegroundColor Cyan
Write-Host "1. cd backend; npm install" -ForegroundColor White
Write-Host "2. Configure backend\.env com suas credenciais" -ForegroundColor White
Write-Host "3. npm run db:generate; npm run db:migrate; npm run db:seed" -ForegroundColor White
Write-Host "4. npm run dev" -ForegroundColor White
Write-Host "5. Em outro terminal: cd frontend; npm install; npm run dev" -ForegroundColor White

Write-Host ""
Write-Host "Bootstrap concluido." -ForegroundColor Green
