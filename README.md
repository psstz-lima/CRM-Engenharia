# CRM Engenharia

Sistema de gerenciamento de contratos de engenharia com controle de medições, aditivos e permissões granulares.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## 📋 Funcionalidades

### Contratos
- ✅ Cadastro e gerenciamento de contratos
- ✅ Planilha hierárquica de itens (grupos e composições)
- ✅ Importação de planilhas Excel
- ✅ Cálculo automático de valores (quantidade × preço unitário)

### Medições
- ✅ Criação de medições vinculadas a contratos
- ✅ Lançamento de quantidades medidas
- ✅ Galeria de fotos com metadados (data, localização)
- ✅ Editor de imagens integrado
- ✅ Cálculo automático de valores medidos

### Aditivos
- ✅ Registro de aditivos contratuais
- ✅ Fluxo de aprovação
- ✅ Histórico de alterações

### Sistema de Permissões
- ✅ 19 permissões granulares em 7 categorias
- ✅ Perfis pré-definidos (Admin, Gestor, Engenheiro, Visualizador)
- ✅ Interface de gerenciamento intuitiva
- ✅ Controle no frontend e backend

### Interface
- ✅ Filtro de pesquisa em planilhas
- ✅ Agrupamento com expandir/recolher
- ✅ Design responsivo e moderno
- ✅ Sidebar dinâmica baseada em permissões

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express** - API REST
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **Multer** - Upload de arquivos

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **React Router** - Roteamento SPA
- **Axios** - Requisições HTTP

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
# Usando o script (Windows PowerShell)
.\scripts\start.ps1

# Ou manualmente:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### 5. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

## 📁 Estrutura do Projeto

```
CRM-Engenharia/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Modelo do banco de dados
│   │   ├── seed.ts           # Dados iniciais
│   │   └── migrations/       # Migrações do banco
│   ├── src/
│   │   ├── controllers/      # Lógica das rotas
│   │   ├── middlewares/      # Auth, permissões
│   │   ├── routes/           # Definição de rotas
│   │   └── server.ts         # Entrada da aplicação
│   └── uploads/              # Arquivos enviados
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       │   ├── contracts/    # Planilhas, editores
│       │   ├── layout/       # Sidebar, Header
│       │   └── modals/       # Modais diversos
│       ├── contexts/         # Context API (Auth)
│       ├── pages/            # Páginas da aplicação
│       └── services/         # API client
│
└── scripts/                  # Scripts de automação
    ├── start.ps1
    └── stop.ps1
```

## 🔐 Permissões

O sistema possui 19 permissões organizadas em 7 categorias:

| Categoria | Permissões |
|-----------|------------|
| Contratos | `contracts_view`, `contracts_create`, `contracts_edit`, `contracts_delete` |
| Medições | `measurements_view`, `measurements_create`, `measurements_edit`, `measurements_delete` |
| Aditivos | `addendums_view`, `addendums_create`, `addendums_approve` |
| Empresas | `companies_view`, `companies_manage` |
| Usuários | `users_view`, `users_manage` |
| Relatórios | `reports_view`, `reports_export` |
| Admin | `admin_roles`, `admin_settings` |

### Perfis Pré-definidos

- **Administrador**: Acesso total ao sistema
- **Gestor de Contratos**: Gerencia contratos e aditivos
- **Engenheiro de Medição**: Cria e edita medições
- **Visualizador**: Apenas visualização

## 📝 API Endpoints

### Autenticação
- `POST /auth/login` - Login
- `GET /auth/me` - Usuário atual

### Contratos
- `GET /contracts` - Listar contratos
- `POST /contracts` - Criar contrato
- `GET /contracts/:id` - Detalhes do contrato
- `PUT /contracts/:id` - Atualizar contrato
- `DELETE /contracts/:id` - Excluir contrato

### Medições
- `GET /contracts/:contractId/measurements` - Listar medições
- `POST /contracts/:contractId/measurements` - Criar medição
- `PUT /measurements/:id/items` - Atualizar itens medidos

### Fotos
- `GET /measurements/:measurementId/photos` - Listar fotos
- `POST /measurements/:measurementId/photos` - Upload de foto
- `DELETE /photos/:id` - Excluir foto

## 👥 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ por Paulo Lima
