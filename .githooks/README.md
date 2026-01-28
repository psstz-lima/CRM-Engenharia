# Hooks locais

Este projeto usa hooks locais em `.githooks`.

## Ativar (se nao estiver ativo)

Execute:

```
git config core.hooksPath .githooks
```

## Pre-commit

`pre-commit.cmd` valida `scripts/start.ps1` e `scripts/stop.ps1` com PSScriptAnalyzer.
Se o modulo nao estiver instalado, o hook nao bloqueia o commit.
