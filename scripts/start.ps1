# SCRIPT DE INICIALIZACAO DO SISTEMA

param(
    [switch]$NoWait,
    [switch]$ForceInstall
)

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
$rootPath = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $rootPath "scripts\.pids.json"

Write-Host "[1/5] Verificando ambiente..." -ForegroundColor Cyan
Write-Host "      Sistema configurado para PostgreSQL" -ForegroundColor Green
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "[2/5] Gerando Prisma Client..." -ForegroundColor Cyan
# Encerra processos anteriores para liberar o query_engine do Prisma
& "$rootPath\scripts\stop.ps1" | Out-Null

Set-Location "$rootPath\backend"
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "      OK - Client gerado!" -ForegroundColor Green
}
else {
    Write-Host "      Erro ao gerar client, tentando limpar cache Prisma..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$rootPath\backend\node_modules\.prisma" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    npm run db:generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      OK - Client gerado apos limpeza!" -ForegroundColor Green
    }
    else {
        Write-Host "      Erro ao gerar client" -ForegroundColor Red
    }
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
Write-Host "[4/5] Verificando dependencias do frontend..." -ForegroundColor Cyan
Set-Location "$rootPath\frontend"

$nodeModulesPath = Join-Path $PWD "node_modules"
if ($ForceInstall -or -not (Test-Path $nodeModulesPath)) {
    Write-Host "      Instalando dependencias (npm install)..." -ForegroundColor Yellow
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      OK - Frontend pronto!" -ForegroundColor Green
    }
    else {
        Write-Host "      Erro ao instalar dependencias do frontend" -ForegroundColor Red
    }
}
else {
    Write-Host "      OK - node_modules ja existe (use -ForceInstall para reinstalar)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/5] Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SISTEMA PRONTO E INICIANDO!          " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciais: ver README.md / seeds do banco" -ForegroundColor Cyan
Write-Host ""
Write-Host "Abrindo em 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar backend em nova janela
$backendProc = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd '$PWD\..\backend'; Write-Host 'BACKEND INICIANDO...' -ForegroundColor Cyan; npm run dev"

# Aguardar backend iniciar
Start-Sleep -Seconds 3

# Iniciar frontend em nova janela
$frontendProc = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'FRONTEND INICIANDO...' -ForegroundColor Cyan; npm run dev"

# Salvar PIDs para encerramento preciso no stop.ps1
try {
    @{
        rootPath    = $rootPath
        startedAt   = (Get-Date).ToString("o")
        backendPid  = $backendProc.Id
        frontendPid = $frontendProc.Id
    } | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8
    Write-Host "PIDs salvos em: $pidFile" -ForegroundColor DarkGray
}
catch {
    Write-Host "Aviso: nao foi possivel salvar PIDs em $pidFile" -ForegroundColor Yellow
}

# Aguardar frontend iniciar
Start-Sleep -Seconds 5

# Abrir navegador
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "SISTEMA RODANDO!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000 (abrindo...)" -ForegroundColor White
Write-Host ""
if (-not $NoWait) {
    Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
