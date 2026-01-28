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
$InformationPreference = 'Continue'

Write-Information "========================================"
Write-Information "  INICIALIZANDO CRM ENGENHARIA         "
Write-Information "  Ambiente: PostgreSQL                  "
Write-Information "========================================"
Write-Information ""

$ErrorActionPreference = "Continue"
$rootPath = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $rootPath "scripts\.pids.json"

Write-Information "[1/5] Verificando ambiente..."
Write-Information "      Sistema configurado para PostgreSQL"
Start-Sleep -Seconds 1

Write-Information ""
Write-Information "[2/5] Gerando Prisma Client..."
# Encerra processos anteriores para liberar o query_engine do Prisma
& "$rootPath\scripts\stop.ps1" | Out-Null

Set-Location "$rootPath\backend"
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Information "      OK - Client gerado!"
}
else {
    Write-Warning "      Erro ao gerar client, tentando limpar cache Prisma..."
    Remove-Item -Recurse -Force "$rootPath\backend\node_modules\.prisma" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    npm run db:generate
    if ($LASTEXITCODE -eq 0) {
        Write-Information "      OK - Client gerado apos limpeza!"
    }
    else {
        Write-Warning "      Erro ao gerar client"
    }
}

Write-Information ""
Write-Information "[3/5] Verificando banco de dados..."
npm run db:migrate
if ($LASTEXITCODE -eq 0) {
    Write-Information "      OK - Banco atualizado!"
}
else {
    Write-Warning "      Aviso: Migracao com avisos (normal)"
}

Write-Information ""
Write-Information "[4/5] Verificando dependencias do frontend..."
Set-Location "$rootPath\frontend"

$nodeModulesPath = Join-Path $PWD "node_modules"
if ($ForceInstall -or -not (Test-Path $nodeModulesPath)) {
    Write-Information "      Instalando dependencias (npm install)..."
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Information "      OK - Frontend pronto!"
    }
    else {
        Write-Warning "      Erro ao instalar dependencias do frontend"
    }
}
else {
    Write-Information "      OK - node_modules ja existe (use -ForceInstall para reinstalar)"
}

Write-Information ""
Write-Information "[5/5] Iniciando servidores..."
Write-Information ""

Write-Information "========================================"
Write-Information "  SISTEMA PRONTO E INICIANDO!          "
Write-Information "========================================"
Write-Information ""
Write-Information "Credenciais: ver README.md / seeds do banco"
Write-Information ""
Write-Information "Abrindo em 5 segundos..."
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
    Write-Information "PIDs salvos em: $pidFile"
}
catch {
    Write-Warning "Aviso: nao foi possivel salvar PIDs em $pidFile"
}

# Aguardar frontend iniciar
Start-Sleep -Seconds 5

# Abrir navegador
Start-Process "http://localhost:3000"

Write-Information ""
Write-Information "SISTEMA RODANDO!"
Write-Information "Backend: http://localhost:3001"
Write-Information "Frontend: http://localhost:3000 (abrindo...)"
Write-Information ""
if (-not $NoWait) {
    Write-Information "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
