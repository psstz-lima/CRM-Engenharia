# CRM Engenharia

Sistema de gerenciamento de contratos de engenharia com controle de medições, aditivos e permissões granulares.

> ⚠️ **POLÍTICA DE ESTILO:** Este projeto segue uma política estrita de **"Pure HTML"**. Não é permitido o uso de CSS global ou Tailwind classes. A estruturação visual deve ser feita exclusivamente via HTML semântico ou, em último caso, estilos inline mínimos.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## 📋 Funcionalidades

### Contratos
- ✅ Cadastro e gerenciamento de contratos
- ✅ Planilha hierárquica de itens (grupos e composições)
- ✅ Importação de planilhas Excel (com validação e proteção)
- ✅ Cálculo automático de valores (quantidade × preço unitário)
- ✅ **Aditivos Contratuais**: Controle de aditivos de valor e prazo

### Medições
- ✅ Criação de medições vinculadas a contratos
- ✅ **Workflow Visual**: Barra de progresso (Em Elaboração → Em Aprovação → Aprovado → Concluído)
- ✅ Lançamento de quantidades medidas
- ✅ Galeria de fotos com metadados
- ✅ Cálculo automático de valores medidos

### Sistema
- ✅ **Notificações em Tempo Real**: Alertas visuais e central de notificações
- ✅ Sistema de Permissões Granular (19 permissões / 7 categorias)
- ✅ Perfis de acesso: Admin, Gestor, Engenheiro, Visualizador
- ✅ Interface limpa (Pure HTML)

### Gestão Corporativa
- ✅ Cadastro de Empresas e Unidades
- ✅ Níveis de Aprovação configuráveis
- ✅ Auditoria de ações (Logs do sistema)

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express** - API REST
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação e Segurança
- **Services Pattern** - Arquitetura em camadas (Controller/Service)

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **React Router** - Navegação SPA
- **Context API** - Gerenciamento de estado (Auth)

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/psstz-lima/CRM-Engenharia.git
cd CRM-Engenharia
```

### 2. Configure as variáveis de ambiente

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/crm_engenharia"
JWT_SECRET="sua-chave-secreta"
PORT=3001
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3001
```

### 3. Instale as dependências
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed

# Frontend
cd ../frontend
npm install
```

### 4. Inicie a aplicação
```bash
# Script Automático (Recomendado)
.\scripts\start.ps1

# Manualmente:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm start
```

## 📁 Estrutura do Projeto

```
CRM-Engenharia/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Controladores de rota
│   │   ├── services/         # Regras de negócio
│   │   ├── routes/           # Definição de endpoints
│   │   └── models/           # Tipos e interfaces
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   ├── layout/       # Sidebar, Navbar (Pure HTML)
│   │   │   ├── common/       # Notificações, Inputs
│   │   ├── pages/            # Telas do sistema
│   │   └── contexts/         # Estado global
│
└── scripts/                  # Automação (PowerShell)
```

## 👥 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com ❤️ por Paulo Lima
