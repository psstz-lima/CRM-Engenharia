# Script para parar o sistema com seguranca
# Encerra preferencialmente os PIDs salvos pelo start.ps1 e, como fallback,
# apenas processos deste repositorio nas portas 3000 (frontend) e 3001 (backend).

chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$rootPath = (Split-Path -Parent $PSScriptRoot)
$rootPathNorm = $rootPath.ToLowerInvariant()
$pidFile = Join-Path $rootPath "scripts\.pids.json"

Write-Information "========================================"
Write-Information "  PARANDO CRM ENGENHARIA               "
Write-Information "========================================"
Write-Information ""

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

function Test-RepoProcess {
    param(
        [int]$ProcessId,
        [string]$ExpectedSegment
    )

    $cmd = Get-ProcessCommandLine -ProcessId $ProcessId
    if (-not $cmd) { return $false }

    $cmdNorm = $cmd.ToLowerInvariant()
    return $cmdNorm.Contains($rootPathNorm) -and $cmdNorm.Contains($ExpectedSegment)
}

function Stop-TrackedProcess {
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([bool])]
    param([string]$TrackedPidFile)

    if (-not (Test-Path $TrackedPidFile)) {
        return $false
    }

    Write-Information "Encontrado arquivo de PIDs: $TrackedPidFile"

    try {
        $tracked = Get-Content $TrackedPidFile -Raw | ConvertFrom-Json
    }
    catch {
        Write-Warning "Aviso: nao foi possivel ler $TrackedPidFile"
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
            Write-Information "$($t.Name): PID $($t.Pid) ja nao existe"
            continue
        }

        if (Test-RepoProcess -ProcessId $t.Pid -ExpectedSegment $t.Segment) {
            if ($PSCmdlet.ShouldProcess("$($t.Name) PID $($t.Pid)", "Encerrar processo")) {
                try {
                    Stop-Process -Id $t.Pid -Force -ErrorAction Stop
                    Write-Information "$($t.Name): encerrado via PID rastreado ($($t.Pid))"
                    $killedAny = $true
                }
                catch {
                    Write-Warning "$($t.Name): erro ao encerrar PID $($t.Pid)"
                }
            }
        }
        else {
            Write-Warning "$($t.Name): PID $($t.Pid) nao parece ser deste repo (ignorado)"
        }
    }

    try {
        Remove-Item $TrackedPidFile -Force -ErrorAction SilentlyContinue
    }
    catch {
        Write-Verbose "Nao foi possivel remover o arquivo de PIDs: $TrackedPidFile"
    }

    return $killedAny
}

function Stop-PortProcess {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [int]$Port,
        [string]$Name,
        [string]$ExpectedSegment
    )

    Write-Information "Verificando $Name (Porta $Port)..."

    $pidsToKill = @()
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop
        $pidsToKill = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    }
    catch {
        Write-Verbose "Nenhuma conexao encontrada na porta $Port"
    }

    if (-not $pidsToKill) {
        Write-Information " [NAO RODANDO]"
        return
    }

    $killed = $false
    foreach ($procId in $pidsToKill) {
        if ($procId -le 4) { continue }

        $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if (-not $process) { continue }

        if (Test-RepoProcess -ProcessId $procId -ExpectedSegment $ExpectedSegment) {
            if ($PSCmdlet.ShouldProcess("PID $procId - $($process.ProcessName)", "Encerrar processo")) {
                try {
                    Stop-Process -Id $procId -Force -ErrorAction Stop
                    Write-Information " [ENCERRADO] (PID: $procId - $($process.ProcessName))"
                    $killed = $true
                }
                catch {
                    Write-Warning " [ERRO] (PID: $procId - $($process.ProcessName))"
                }
            }
        }
        else {
            Write-Warning " [IGNORADO] (PID: $procId - $($process.ProcessName))"
        }
    }

    if (-not $killed) {
        Write-Information " [NENHUM PROCESSO DO REPO ENCONTRADO]"
    }
}

# 1) Tentar encerrar processos rastreados
$killedTracked = Stop-TrackedProcess -TrackedPidFile $pidFile

# 2) Fallback: verificar por porta de forma seletiva
Stop-PortProcess -Port 3000 -Name "Frontend" -ExpectedSegment "\\frontend"
Stop-PortProcess -Port 3001 -Name "Backend" -ExpectedSegment "\\backend"

Write-Information ""
if ($killedTracked) {
    Write-Information "Processos rastreados foram encerrados. Fallback por porta tambem foi verificado."
}
else {
    Write-Information "Processos do CRM nas portas 3000/3001 foram verificados."
}
Write-Information "Nota: outros servicos nessas portas foram preservados."
Start-Sleep -Seconds 1
