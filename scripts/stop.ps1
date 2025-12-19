# Script para Parar o Sistema com Segurança
# Encerra os processos rodando nas portas do Frontend (3000) e Backend (3001)

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  PARANDO CRM ENGENHARIA               " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

function Kill-Port ($port, $name) {
    Write-Host "Verificando $name (Porta $port)..." -NoNewline
    
    $pidsToKill = @()
    try {
        # Busca conexões TCP na porta especificada
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        # Extrai PIDs únicos
        $pidsToKill = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    }
    catch {
        # Se não encontrar conexão, Get-NetTCPConnection lança erro. Ignoramos.
    }

    if ($pidsToKill) {
        $killed = $false
        foreach ($procId in $pidsToKill) {
            # Ignora PID 0 (System Idle) e PID 4 (System) geralmente, mas Get-NetTCP on user ports usually isn't strict system
            if ($procId -gt 4) { 
                try {
                    $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
                    if ($process) {
                        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                        Write-Host " [ENCERRADO] (PID: $procId)" -ForegroundColor Green
                        $killed = $true
                    }
                }
                catch {
                    Write-Host " [ERRO] (PID: $procId)" -ForegroundColor Red
                }
            }
        }
        if (-not $killed) {
             Write-Host " [NAO ENCONTRADO/JA PARADO]" -ForegroundColor Gray
        }
    }
    else {
        Write-Host " [NAO RODANDO]" -ForegroundColor Gray
    }
}

# Parar Frontend
Kill-Port 3000 "Frontend"

# Parar Backend
Kill-Port 3001 "Backend"

Write-Host ""
Write-Host "✅ Processos de servidor parados." -ForegroundColor Green
Write-Host "Nota: As janelas do terminal podem permanecer abertas." -ForegroundColor Gray
Start-Sleep -Seconds 3
