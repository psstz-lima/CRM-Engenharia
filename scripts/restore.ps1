# Script de restauracao de backup PostgreSQL
# Uso: .\restore.ps1 -BackupPath ".\backups\2026-01-08_10-00-00" [-Force] [-SchemaOnly]

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupPath,
    [switch]$Force,          # Forca restauracao sem confirmacao
    [switch]$SchemaOnly      # Restaurar apenas schema
)

$ErrorActionPreference = "Stop"

# Forcar saida em UTF-8 para evitar textos quebrados no console
chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

# Configuracoes
$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "crm_engenharia" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

function Resolve-Tool {
    param(
        [string]$CommandName,
        [string]$DefaultPath
    )

    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    if (Test-Path $DefaultPath) { return $DefaultPath }
    return $null
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTAURACAO POSTGRESQL - CRM ENG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se backup existe
if (-not (Test-Path $BackupPath)) {
    Write-Host "ERRO: Backup nao encontrado: $BackupPath" -ForegroundColor Red
    exit 1
}

# Verificar arquivos disponiveis
$FullBackup = Join-Path $BackupPath "full_backup.dump"
$SchemaFile = Join-Path $BackupPath "schema.sql"
$DataFile = Join-Path $BackupPath "data.sql"
$ChecksumFile = Join-Path $BackupPath "checksum.txt"
$MetaFile = Join-Path $BackupPath "metadata.json"

$hasFullBackup = Test-Path $FullBackup
$hasSchemaFile = Test-Path $SchemaFile
$hasDataFile = Test-Path $DataFile

if (-not $hasFullBackup -and -not $hasSchemaFile) {
    Write-Host "ERRO: Nenhum backup utilizavel encontrado (full_backup.dump ou schema.sql)." -ForegroundColor Red
    exit 1
}

if ($SchemaOnly -and -not $hasSchemaFile -and -not $hasFullBackup) {
    Write-Host "ERRO: -SchemaOnly requer schema.sql ou full_backup.dump." -ForegroundColor Red
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

# Verificar checksum (quando houver full backup)
Write-Host "[1/3] Verificando integridade..." -ForegroundColor Yellow
if ($hasFullBackup -and (Test-Path $ChecksumFile)) {
    $StoredChecksum = (Get-Content $ChecksumFile).Split(" ")[0]
    $CurrentChecksum = (Get-FileHash $FullBackup -Algorithm SHA256).Hash

    if ($StoredChecksum -eq $CurrentChecksum) {
        Write-Host "  OK - Checksum valido" -ForegroundColor Green
    }
    else {
        Write-Host "  ERRO - CHECKSUM INVALIDO! Backup pode estar corrompido." -ForegroundColor Red
        if (-not $Force) {
            exit 1
        }
    }
}
elseif ($hasFullBackup) {
    Write-Host "  Aviso - checksum.txt nao encontrado" -ForegroundColor Yellow
}
else {
    Write-Host "  Aviso - sem full backup; checksum nao aplicavel" -ForegroundColor Yellow
}

# Confirmacao
if (-not $Force) {
    Write-Host ""
    Write-Host "ATENCAO: Esta operacao ira SOBRESCREVER o banco '$DbName'!" -ForegroundColor Red
    $confirm = Read-Host "Digite 'RESTAURAR' para continuar"
    if ($confirm -ne "RESTAURAR") {
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# Resolver ferramentas
$PgRestore = Resolve-Tool -CommandName "pg_restore" -DefaultPath "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
$Psql = Resolve-Tool -CommandName "psql" -DefaultPath "C:\Program Files\PostgreSQL\16\bin\psql.exe"

if ($hasFullBackup -and -not $PgRestore) {
    Write-Host "ERRO: pg_restore nao encontrado!" -ForegroundColor Red
    exit 1
}

if (-not $hasFullBackup -and -not $Psql) {
    Write-Host "ERRO: psql nao encontrado para restauracao via schema/data." -ForegroundColor Red
    exit 1
}

if ($SchemaOnly -and -not $hasFullBackup -and -not $hasSchemaFile) {
    Write-Host "ERRO: schema.sql nao encontrado para restauracao apenas de schema." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Restaurando backup..." -ForegroundColor Yellow

try {
    if ($hasFullBackup) {
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

        Write-Host "  OK - Banco restaurado via pg_restore" -ForegroundColor Green
    }
    else {
        # Restaurar via SQL (schema/data)
        if (-not $hasSchemaFile) {
            Write-Host "ERRO: schema.sql nao encontrado para restauracao via SQL." -ForegroundColor Red
            exit 1
        }

        Write-Host "  Aplicando schema.sql..." -ForegroundColor DarkGray
        & $Psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $SchemaFile | Out-Null

        if (-not $SchemaOnly -and $hasDataFile) {
            Write-Host "  Aplicando data.sql..." -ForegroundColor DarkGray
            & $Psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $DataFile | Out-Null
        }

        Write-Host "  OK - Banco restaurado via schema/data" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERRO na restauracao: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Verificando restauracao..." -ForegroundColor Yellow

# Verificacao rapida (quando psql estiver disponivel)
if ($Psql) {
    $TableCount = & $Psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    Write-Host "  OK - $($TableCount.Trim()) tabelas encontradas" -ForegroundColor Green
}
else {
    Write-Host "  Aviso - psql nao encontrado; verificacao pulada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESTAURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
