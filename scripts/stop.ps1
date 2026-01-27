# Script para parar o sistema com seguranca
# Encerra preferencialmente os PIDs salvos pelo start.ps1 e, como fallback,
# apenas processos deste repositorio nas portas 3000 (frontend) e 3001 (backend).

chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$rootPath = (Split-Path -Parent $PSScriptRoot)
$rootPathNorm = $rootPath.ToLowerInvariant()
$pidFile = Join-Path $rootPath "scripts\.pids.json"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  PARANDO CRM ENGENHARIA               " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

function Get-ProcessCommandLine {
    param([int]$ProcessId)
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
        return $proc.CommandLine
    }
    catch {
        return $null
    }
}

function Is-RepoProcess {
    param(
        [int]$ProcessId,
        [string]$ExpectedSegment
    )

    $cmd = Get-ProcessCommandLine -ProcessId $ProcessId
    if (-not $cmd) { return $false }

    $cmdNorm = $cmd.ToLowerInvariant()
    return $cmdNorm.Contains($rootPathNorm) -and $cmdNorm.Contains($ExpectedSegment)
}

function Stop-TrackedProcesses {
    param([string]$TrackedPidFile)

    if (-not (Test-Path $TrackedPidFile)) {
        return $false
    }

    Write-Host "Encontrado arquivo de PIDs: $TrackedPidFile" -ForegroundColor DarkGray

    try {
        $tracked = Get-Content $TrackedPidFile -Raw | ConvertFrom-Json
    }
    catch {
        Write-Host "Aviso: nao foi possivel ler $TrackedPidFile" -ForegroundColor Yellow
        return $false
    }

    $killedAny = $false

    $targets = @(
        @{ Name = "Backend";  Pid = [int]$tracked.backendPid;  Segment = "\\backend" },
        @{ Name = "Frontend"; Pid = [int]$tracked.frontendPid; Segment = "\\frontend" }
    )

    foreach ($t in $targets) {
        if (-not $t.Pid -or $t.Pid -le 4) { continue }

        $proc = Get-Process -Id $t.Pid -ErrorAction SilentlyContinue
        if (-not $proc) {
            Write-Host "$($t.Name): PID $($t.Pid) ja nao existe" -ForegroundColor Gray
            continue
        }

        if (Is-RepoProcess -ProcessId $t.Pid -ExpectedSegment $t.Segment) {
            try {
                Stop-Process -Id $t.Pid -Force -ErrorAction Stop
                Write-Host "$($t.Name): encerrado via PID rastreado ($($t.Pid))" -ForegroundColor Green
                $killedAny = $true
            }
            catch {
                Write-Host "$($t.Name): erro ao encerrar PID $($t.Pid)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "$($t.Name): PID $($t.Pid) nao parece ser deste repo (ignorado)" -ForegroundColor Yellow
        }
    }

    try {
        Remove-Item $TrackedPidFile -Force -ErrorAction SilentlyContinue
    }
    catch {
        # sem impacto funcional
    }

    return $killedAny
}

function Kill-Port {
    param(
        [int]$Port,
        [string]$Name,
        [string]$ExpectedSegment
    )

    Write-Host "Verificando $Name (Porta $Port)..." -NoNewline

    $pidsToKill = @()
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop
        $pidsToKill = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    }
    catch {
        # Nenhuma conexao encontrada na porta
    }

    if (-not $pidsToKill) {
        Write-Host " [NAO RODANDO]" -ForegroundColor Gray
        return
    }

    $killed = $false
    foreach ($procId in $pidsToKill) {
        if ($procId -le 4) { continue }

        $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if (-not $process) { continue }

        if (Is-RepoProcess -ProcessId $procId -ExpectedSegment $ExpectedSegment) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host " [ENCERRADO] (PID: $procId - $($process.ProcessName))" -ForegroundColor Green
                $killed = $true
            }
            catch {
                Write-Host " [ERRO] (PID: $procId - $($process.ProcessName))" -ForegroundColor Red
            }
        }
        else {
            Write-Host " [IGNORADO] (PID: $procId - $($process.ProcessName))" -ForegroundColor Yellow
        }
    }

    if (-not $killed) {
        Write-Host " [NENHUM PROCESSO DO REPO ENCONTRADO]" -ForegroundColor Gray
    }
}

# 1) Tentar encerrar processos rastreados
$killedTracked = Stop-TrackedProcesses -TrackedPidFile $pidFile

# 2) Fallback: verificar por porta de forma seletiva
Kill-Port -Port 3000 -Name "Frontend" -ExpectedSegment "\\frontend"
Kill-Port -Port 3001 -Name "Backend" -ExpectedSegment "\\backend"

Write-Host ""
if ($killedTracked) {
    Write-Host "Processos rastreados foram encerrados. Fallback por porta tambem foi verificado." -ForegroundColor Green
}
else {
    Write-Host "Processos do CRM nas portas 3000/3001 foram verificados." -ForegroundColor Green
}
Write-Host "Nota: outros servicos nessas portas foram preservados." -ForegroundColor Gray
Start-Sleep -Seconds 1
