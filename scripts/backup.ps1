# Script de Backup Automático do PostgreSQL
# Uso: .\backup.ps1 [-Full] [-Retention 7]

param(
    [switch]$Full,           # Backup completo vs incremental
    [int]$Retention = 7,     # Dias para manter backups
    [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"

# Configurações
$DbHost = $env:DB_HOST ?? "localhost"
$DbPort = $env:DB_PORT ?? "5432"
$DbName = $env:DB_NAME ?? "crm_eng"
$DbUser = $env:DB_USER ?? "postgres"

# Diretórios
$DateStamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupPath = Join-Path $BackupDir $DateStamp

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP POSTGRESQL - CRM ENGENHARIA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Criar diretório de backup
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[1/4] Diretório de backup criado: $BackupDir" -ForegroundColor Green
}
else {
    Write-Host "[1/4] Diretório de backup existe" -ForegroundColor Green
}

# Criar subdiretório para este backup
New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null

# Verificar pg_dump
$PgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $PgDump) {
    # Tentar encontrar no PATH do PostgreSQL
    $PgPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
    if (Test-Path $PgPath) {
        $PgDump = $PgPath
    }
    else {
        Write-Host "ERRO: pg_dump não encontrado!" -ForegroundColor Red
        Write-Host "Adicione o PostgreSQL ao PATH ou instale-o." -ForegroundColor Yellow
        exit 1
    }
}
else {
    $PgDump = $PgDump.Source
}

Write-Host "[2/4] Iniciando backup..." -ForegroundColor Yellow

try {
    # Backup do schema
    $SchemaFile = Join-Path $BackupPath "schema.sql"
    & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName --schema-only -f $SchemaFile
    Write-Host "  ✓ Schema exportado" -ForegroundColor Green

    # Backup dos dados
    $DataFile = Join-Path $BackupPath "data.sql"
    & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName --data-only -f $DataFile
    Write-Host "  ✓ Dados exportados" -ForegroundColor Green

    # Backup completo (custom format - comprimido)
    $FullFile = Join-Path $BackupPath "full_backup.dump"
    & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName -Fc -f $FullFile
    Write-Host "  ✓ Backup completo gerado" -ForegroundColor Green

    # Gerar checksum
    $Checksum = Get-FileHash $FullFile -Algorithm SHA256
    $ChecksumFile = Join-Path $BackupPath "checksum.txt"
    "$($Checksum.Hash)  full_backup.dump" | Out-File $ChecksumFile
    Write-Host "  ✓ Checksum gerado" -ForegroundColor Green

    # Metadados
    $MetaFile = Join-Path $BackupPath "metadata.json"
    @{
        timestamp = Get-Date -Format "o"
        database  = $DbName
        host      = $DbHost
        type      = if ($Full) { "full" } else { "incremental" }
        files     = @("schema.sql", "data.sql", "full_backup.dump")
        checksum  = $Checksum.Hash
    } | ConvertTo-Json | Out-File $MetaFile
    Write-Host "  ✓ Metadados salvos" -ForegroundColor Green

}
catch {
    Write-Host "ERRO no backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/4] Backup concluído!" -ForegroundColor Green

# Limpeza de backups antigos
Write-Host "[4/4] Limpando backups antigos (> $Retention dias)..." -ForegroundColor Yellow

$CutoffDate = (Get-Date).AddDays(-$Retention)
$OldBackups = Get-ChildItem $BackupDir -Directory | Where-Object { $_.CreationTime -lt $CutoffDate }

if ($OldBackups.Count -gt 0) {
    foreach ($old in $OldBackups) {
        Remove-Item $old.FullName -Recurse -Force
        Write-Host "  ✓ Removido: $($old.Name)" -ForegroundColor DarkGray
    }
    Write-Host "  $($OldBackups.Count) backup(s) antigo(s) removido(s)" -ForegroundColor Green
}
else {
    Write-Host "  Nenhum backup antigo para remover" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local: $BackupPath" -ForegroundColor Cyan
Write-Host ""

# Mostrar tamanho
$Size = (Get-ChildItem $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$SizeMB = [math]::Round($Size / 1MB, 2)
Write-Host "Tamanho total: $SizeMB MB" -ForegroundColor White
