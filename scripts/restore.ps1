# Script de Restauração de Backup PostgreSQL
# Uso: .\restore.ps1 -BackupPath ".\backups\2026-01-08_10-00-00"

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupPath,
    [switch]$Force,          # Força restauração sem confirmação
    [switch]$SchemaOnly      # Restaurar apenas schema
)

$ErrorActionPreference = "Stop"

# Configurações
$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "crm_eng" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTAURAÇÃO POSTGRESQL - CRM ENG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se backup existe
if (-not (Test-Path $BackupPath)) {
    Write-Host "ERRO: Backup não encontrado: $BackupPath" -ForegroundColor Red
    exit 1
}

# Verificar arquivos necessários
$FullBackup = Join-Path $BackupPath "full_backup.dump"
$ChecksumFile = Join-Path $BackupPath "checksum.txt"
$MetaFile = Join-Path $BackupPath "metadata.json"

if (-not (Test-Path $FullBackup)) {
    Write-Host "ERRO: Arquivo full_backup.dump não encontrado!" -ForegroundColor Red
    exit 1
}

# Mostrar metadados
if (Test-Path $MetaFile) {
    $Meta = Get-Content $MetaFile | ConvertFrom-Json
    Write-Host "Backup de: $($Meta.timestamp)" -ForegroundColor Yellow
    Write-Host "Banco: $($Meta.database)" -ForegroundColor Yellow
    Write-Host "Tipo: $($Meta.type)" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar checksum
Write-Host "[1/3] Verificando integridade..." -ForegroundColor Yellow
if (Test-Path $ChecksumFile) {
    $StoredChecksum = (Get-Content $ChecksumFile).Split(" ")[0]
    $CurrentChecksum = (Get-FileHash $FullBackup -Algorithm SHA256).Hash
    
    if ($StoredChecksum -eq $CurrentChecksum) {
        Write-Host "  ✓ Checksum válido" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ CHECKSUM INVÁLIDO! Backup pode estar corrompido." -ForegroundColor Red
        if (-not $Force) {
            exit 1
        }
    }
}
else {
    Write-Host "  ⚠ Arquivo de checksum não encontrado" -ForegroundColor Yellow
}

# Confirmação
if (-not $Force) {
    Write-Host ""
    Write-Host "ATENÇÃO: Esta operação irá SOBRESCREVER o banco '$DbName'!" -ForegroundColor Red
    $confirm = Read-Host "Digite 'RESTAURAR' para continuar"
    if ($confirm -ne "RESTAURAR") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# Verificar pg_restore
$PgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $PgRestore) {
    $PgPath = "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
    if (Test-Path $PgPath) {
        $PgRestore = $PgPath
    }
    else {
        Write-Host "ERRO: pg_restore não encontrado!" -ForegroundColor Red
        exit 1
    }
}
else {
    $PgRestore = $PgRestore.Source
}

Write-Host ""
Write-Host "[2/3] Restaurando backup..." -ForegroundColor Yellow

try {
    # Restaurar com pg_restore
    $RestoreArgs = @(
        "-h", $DbHost,
        "-p", $DbPort,
        "-U", $DbUser,
        "-d", $DbName,
        "--clean",
        "--if-exists",
        "-v",
        $FullBackup
    )
    
    if ($SchemaOnly) {
        $RestoreArgs += "--schema-only"
    }
    
    & $PgRestore @RestoreArgs 2>&1 | ForEach-Object {
        if ($_ -match "error|ERRO") {
            Write-Host "  $_" -ForegroundColor Red
        }
        elseif ($_ -match "warning|AVISO") {
            Write-Host "  $_" -ForegroundColor Yellow
        }
    }
    
    Write-Host "  ✓ Banco restaurado" -ForegroundColor Green

}
catch {
    Write-Host "ERRO na restauração: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Verificando restauração..." -ForegroundColor Yellow

# Verificação rápida
$Psql = Get-Command psql -ErrorAction SilentlyContinue
if ($Psql) {
    $TableCount = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    Write-Host "  ✓ $($TableCount.Trim()) tabelas encontradas" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESTAURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
