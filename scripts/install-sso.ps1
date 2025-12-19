# Script de Instalação Completa do Módulo SSO
# Execute este arquivo para criar toda a estrutura do projeto

Write-Host "🚀 Instalando CRM Engenharia - Módulo SSO..." -ForegroundColor Cyan

# Criar estrut folders backend
Write-Host "`n📁 Criando estrutura de pastas..." -ForegroundColor Yellow

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

Write-Host "✅ Estrutura de pastas criada!" -ForegroundColor Green

Write-Host "`n📦 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. cd backend && npm install" -ForegroundColor White
Write-Host "2. Configure o arquivo backend\.env com suas credenciais" -ForegroundColor White
Write-Host "3. npm run prisma:generate && npm run prisma:migrate" -ForegroundColor White
Write-Host "4. npm run prisma:seed" -ForegroundColor White
Write-Host "5. npm run dev" -ForegroundColor White
Write-Host "`n6. Em outro terminal: cd frontend && npm install && npm run dev" -ForegroundColor White

Write-Host "`n✨ Estrutura criada com sucesso!" -ForegroundColor Green
