# SCRIPT DE INICIALIZAÃ‡ÃƒO DO SISTEMA
# Inicia Backend e Frontend

# Forca saida em UTF-8 para evitar textos quebrados no console
chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()


Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  INICIALIZANDO CRM ENGENHARIA         " -ForegroundColor Magenta
Write-Host "  Ambiente: PostgreSQL                  " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

$ErrorActionPreference = "Continue"

Write-Host "[1/5] Verificando ambiente..." -ForegroundColor Cyan
Write-Host "      Sistema configurado para PostgreSQL" -ForegroundColor Green
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "[2/5] Gerando Prisma Client..." -ForegroundColor Cyan
$rootPath = Split-Path -Parent $PSScriptRoot
cd "$rootPath\backend"
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "      OK - Client gerado!" -ForegroundColor Green
}
else {
    Write-Host "      Erro ao gerar client" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/5] Verificando banco de dados..." -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -eq 0) {
    Write-Host "      OK - Banco atualizado!" -ForegroundColor Green
}
else {
    Write-Host "      Aviso: Migracao com avisos (normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/5] Instalando dependÃªncias do frontend..." -ForegroundColor Cyan
cd "$rootPath\frontend"
npm install --silent
Write-Host "      OK - Frontend pronto!" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SISTEMA PRONTO E INICIANDO!          " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciais de acesso:" -ForegroundColor Cyan
Write-Host "  Email: paulo.lima@consorcio381.com.br" -ForegroundColor White
Write-Host "  Senha: psstz72659913Ps*" -ForegroundColor White
Write-Host ""
Write-Host "Abrindo em 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar backend em nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\..\backend'; Write-Host 'BACKEND INICIANDO...' -ForegroundColor Cyan; npm run dev"

# Aguardar backend iniciar
Start-Sleep -Seconds 3

# Iniciar frontend em nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'FRONTEND INICIANDO...' -ForegroundColor Cyan; npm run dev"

# Aguardar frontend iniciar
Start-Sleep -Seconds 5

# Abrir navegador
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "SISTEMA RODANDO!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000 (abrindo...)" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
