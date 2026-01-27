# CRM Engenharia

Sistema de gerenciamento de contratos de engenharia com controle de medições, aditivos, documentos, tarefas e permissões granulares.

> **Política de estilo (frontend):** use classes utilitárias e `frontend/src/index.css`. Evite CSS global novo; prefira estilos locais por componente e documente exceções. Exceção atual: o tema premium define tokens e componentes base em `frontend/src/index.css`.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## Stack e arquitetura

- Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
- Frontend: React 18 + Vite + TypeScript + React Router
- Padrão: camadas por domínio (`routes` → `controllers` → `services`)
- Documentação da API: Swagger em `/api/docs`

Pontos de entrada:
- Backend: `backend/src/server.ts`
- Frontend: `frontend/src/main.tsx`

## Funcionalidades principais

- Contratos: cadastro, itens hierárquicos, importação Excel, aditivos
- Medições: workflow, lançamentos, fotos, cálculos
- Documentos: categorias, SLA, visualização e uploads
- Governança: permissões, perfis, auditoria, notificações, tarefas

## Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- npm
- (Opcional) ODA File Converter ou LibreDWG para converter DWG/DXF

## Configuração de ambiente

Backend (`backend/.env`):

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/crm_engenharia"
JWT_SECRET="sua-chave-secreta"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

Frontend (opcional, `frontend/.env`):

```env
VITE_API_URL=http://localhost:3001/api
```

## Como rodar (recomendado)

Na raiz do repositório:

```powershell
.\scripts\start.ps1
```

O script:
- encerra processos anteriores nas portas 3000/3001,
- gera o Prisma Client,
- aplica migrações,
- instala dependências do frontend,
- sobe backend e frontend.

URLs padrão:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api/docs`

Para parar os servidores:

```powershell
.\scripts\stop.ps1
```

## Como rodar (manual)

Backend:

```powershell
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend (em outro terminal):

```powershell
cd frontend
npm install
npm run dev
```

## Scripts úteis

Na raiz:
- `scripts/start.ps1`: sobe o sistema completo
- `scripts/stop.ps1`: encerra processos nas portas 3000 e 3001
- `scripts/backup.ps1` e `scripts/restore.ps1`: utilitários de banco

No backend (`backend/package.json`):
- `npm run dev`: servidor em modo watch (`tsx watch`)
- `npm run db:generate`: gera Prisma Client
- `npm run db:migrate`: aplica migrações
- `npm run db:seed`: popula dados iniciais
- `npm test`: roda testes com Jest

No frontend (`frontend/package.json`):
- `npm run dev`: servidor Vite
- `npm run build`: build de produção
- `npm run preview`: preview do build

## Estrutura do projeto (visão rápida)

```text
CRM-Engenharia/
├─ backend/
│  ├─ prisma/              # schema e migrações
│  └─ src/
│     ├─ config/           # config, banco, swagger, logger
│     ├─ controllers/      # handlers HTTP
│     ├─ middlewares/      # auth, permissões, upload, auditoria
│     ├─ modules/          # jobs agendados, auditoria
│     ├─ routes/           # endpoints
│     └─ services/         # regras de negócio
├─ frontend/
│  ├─ public/
│  └─ src/
│     ├─ components/
│     ├─ contexts/
│     ├─ pages/
│     ├─ routes/
│     └─ services/
└─ scripts/                # automações PowerShell
```

## Testes

Backend:

```powershell
cd backend
npm test
```

Observação: há testes que dependem de mocks do Prisma. Se algum suite falhar por mock incompleto, revise `backend/tests/setup.ts`.

## Contribuição

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Faça commits pequenos e descritivos
3. Rode backend e frontend localmente
4. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.
