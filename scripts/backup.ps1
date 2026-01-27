# Script de backup do PostgreSQL
# Uso: .\backup.ps1 [-Full] [-Retention 7] [-BackupDir .\backups]

param(
    [switch]$Full,           # Inclui exports SQL de schema e dados
    [int]$Retention = 7,     # Dias para manter backups
    [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"

# Forcar saida em UTF-8 para evitar textos quebrados no console
chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

# Configuracoes (sem usar ?? para compatibilidade com PowerShell 5.x)
$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "crm_engenharia" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

# Diretorios
$DateStamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupPath = Join-Path $BackupDir $DateStamp

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP POSTGRESQL - CRM ENGENHARIA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Criar diretorio de backup
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[1/4] Diretorio de backup criado: $BackupDir" -ForegroundColor Green
}
else {
    Write-Host "[1/4] Diretorio de backup existe" -ForegroundColor Green
}

# Criar subdiretorio para este backup
New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null

# Verificar pg_dump
$PgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $PgDump) {
    # Tentar encontrar no PATH padrao do PostgreSQL
    $PgPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
    if (Test-Path $PgPath) {
        $PgDump = $PgPath
    }
    else {
        Write-Host "ERRO: pg_dump nao encontrado!" -ForegroundColor Red
        Write-Host "Adicione o PostgreSQL ao PATH ou ajuste o caminho no script." -ForegroundColor Yellow
        exit 1
    }
}
else {
    $PgDump = $PgDump.Source
}

Write-Host "[2/4] Iniciando backup..." -ForegroundColor Yellow

$files = New-Object System.Collections.Generic.List[string]

try {
    # Sempre gerar backup completo em formato custom (comprimido)
    $FullFile = Join-Path $BackupPath "full_backup.dump"
    & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName -Fc -f $FullFile
    Write-Host "  OK - Backup completo gerado" -ForegroundColor Green
    $files.Add("full_backup.dump") | Out-Null

    # Checksum do backup completo
    $Checksum = Get-FileHash $FullFile -Algorithm SHA256
    $ChecksumFile = Join-Path $BackupPath "checksum.txt"
    "$($Checksum.Hash)  full_backup.dump" | Out-File $ChecksumFile -Encoding utf8
    Write-Host "  OK - Checksum gerado" -ForegroundColor Green
    $files.Add("checksum.txt") | Out-Null

    if ($Full) {
        # Exports adicionais em SQL para inspecao e restauracao parcial
        $SchemaFile = Join-Path $BackupPath "schema.sql"
        & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName --schema-only -f $SchemaFile
        Write-Host "  OK - Schema exportado" -ForegroundColor Green
        $files.Add("schema.sql") | Out-Null

        $DataFile = Join-Path $BackupPath "data.sql"
        & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName --data-only -f $DataFile
        Write-Host "  OK - Dados exportados" -ForegroundColor Green
        $files.Add("data.sql") | Out-Null
    }

    # Metadados
    $MetaFile = Join-Path $BackupPath "metadata.json"
    $backupType = if ($Full) { "full+sql" } else { "full" }
    @{
        timestamp = Get-Date -Format "o"
        database  = $DbName
        host      = $DbHost
        type      = $backupType
        files     = $files
        checksum  = $Checksum.Hash
    } | ConvertTo-Json | Out-File $MetaFile -Encoding utf8
    Write-Host "  OK - Metadados salvos" -ForegroundColor Green
}
catch {
    Write-Host "ERRO no backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/4] Backup concluido!" -ForegroundColor Green

# Limpeza de backups antigos
Write-Host "[4/4] Limpando backups antigos (> $Retention dias)..." -ForegroundColor Yellow

$CutoffDate = (Get-Date).AddDays(-$Retention)
$OldBackups = @(Get-ChildItem $BackupDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.CreationTime -lt $CutoffDate })

if ($OldBackups.Count -gt 0) {
    foreach ($old in $OldBackups) {
        Remove-Item $old.FullName -Recurse -Force
        Write-Host "  OK - Removido: $($old.Name)" -ForegroundColor DarkGray
    }
    Write-Host "  $($OldBackups.Count) backup(s) antigo(s) removido(s)" -ForegroundColor Green
}
else {
    Write-Host "  Nenhum backup antigo para remover" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BACKUP CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local: $BackupPath" -ForegroundColor Cyan
Write-Host ""

# Mostrar tamanho
$Size = (Get-ChildItem $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$SizeMB = [math]::Round($Size / 1MB, 2)
Write-Host "Tamanho total: $SizeMB MB" -ForegroundColor White
