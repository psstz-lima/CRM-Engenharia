# Módulo 1 – SSO, Login e Usuário Master

## 1. Escopo do módulo

O módulo de SSO (Single Sign-On) é responsável por toda a autenticação e controle de acesso do CRM de Engenharia, incluindo:

- Login por usuário/e-mail e senha
- Login específico para Usuário Master
- Controle de permissões (RBAC)
- Convite e gestão de usuários
- Cadastro de empresas
- Políticas de segurança de senha e sessão
- Sistema de notificações por usuário
- Preparação para SSO corporativo via OpenID Connect / OAuth2
- Conformidade com LGPD e rastreabilidade de ações

---

## 2. Tela inicial de login

### 2.1. Login padrão

Campos obrigatórios:
- Usuário ou e-mail
- Senha

Ações disponíveis:
- Botão “Entrar”
- Link “Esqueci minha senha”

Comportamento:
- Caso o usuário solicite recuperação, o sistema envia um link com validade curta para redefinição de senha.
- Após redefinir a senha, todas as sessões anteriores são encerradas automaticamente.

### 2.2. Login de Usuário Master

Na mesma tela de login, abaixo do formulário padrão, deve existir:

- Botão **“Login Usuário Master”**

Função:
- Direciona para a autenticação administrativa.
- Usuário Master acessa o painel administrativo do sistema, incluindo:
  - permissões,
  - cadastro de empresas,
  - gestão de usuários,
  - configurações gerais do SSO.

---

## 3. Conta de usuário

Cada usuário do sistema deve possuir:

- Foto de perfil (opcional)
- Nome completo
- E-mail de login
- Senha (armazenada com hash seguro)
- Empresa vinculada
- Perfil de acesso (somente leitura / editor / administrador / etc.)

### 3.1. Configurações de perfil

Em “Meu perfil”, o usuário pode:

- Alterar senha
- Alterar foto
- Ver registros básicos de acesso
- Configurar preferências de interface

### 3.2. Notificações

O CRM deve possuir sistema interno de notificações, permitindo:

- Alertas de contratos a vencer
- Pendências de medição
- Ações solicitadas por supervisores
- Avisos operacionais ou administrativos

O SSO registra e entrega notificações conforme permissões de cada usuário.

---

## 4. Usuário Master – funções administrativas

O Usuário Master controla toda a estrutura de acesso.

### 4.1. Gestão de permissões (RBAC)

O sistema deve permitir criar perfis com permissões de:

- Visualizar
- Criar
- Editar
- Excluir

Essas permissões podem ser aplicadas a módulos como:

- Contratos
- Medições
- Topografia
- Projetos
- Configurações gerais

### 4.2. Gestão de usuários

Funções do Usuário Master:

- Criar usuários manualmente
- Enviar **convite por e-mail** para novos usuários
- Definir empresa vinculada
- Definir perfil de acesso
- Bloquear e reativar contas
- Forçar troca de senha no próximo login

### 4.3. Cadastro de empresas

O Usuário Master gerencia o cadastro de empresas:

- Empresa proprietária
- Empresas clientes
- Empresas terceiras ou parceiras

As empresas vinculam usuários e contratos, permitindo controle de acesso por entidade.

---

## 5. Segurança do SSO

### 5.1. Política de senha

- Mínimo de 8 a 10 caracteres (configurável)
- Exigir combinação de:
  - letras maiúsculas
  - letras minúsculas
  - números
  - caracteres especiais
- Bloquear senhas fracas e sequencias previsíveis

### 5.2. Tentativas de login

- Após N tentativas incorretas (ex.: 5), bloquear a conta temporariamente
- Registrar logs de falhas e IP aproximado

### 5.3. Controle de sessão

- Timeout configurável por inatividade
- Função “Sair de todos os dispositivos”
- Registrar sessões ativas por usuário
- Possibilidade de encerrar sessões manualmente

### 5.4. Detecção de dispositivo novo

- Se o usuário fizer login em dispositivo nunca visto antes:
  - Enviar e-mail de alerta
  - Registrar log de segurança

---

## 6. Recuperação de senha

Fluxo obrigatório:

1. Usuário informa o e-mail
2. Sistema envia link de redefinição (expira em poucos minutos)
3. Usuário define nova senha
4. Todas as sessões anteriores são removidas

---

## 7. SSO corporativo (OpenID Connect / OAuth2)

O módulo deve estar preparado para integração futura com:

- Google
- Microsoft
- Azure AD
- Auth0
- Qualquer IdP compatível

Regras:

- Provisionamento automático (cria usuário no CRM no primeiro login via SSO)
- Mapeamento automático de email/domínio para empresa, quando configurado

---

## 8. LGPD, auditoria e rastreabilidade

O sistema deve registrar:

- Logins (sucesso e falha)
- IP aproximado
- Navegador/dispositivo
- Ações administrativas críticas (troca de senha, criação de usuário, alteração de perfil)
- Versão aceita dos Termos de Uso e Política de Privacidade

Contas excluídas devem ser apenas **desativadas**, mantendo vínculos históricos.

---

## 9. Encerramento do módulo

Este arquivo documenta toda a estrutura do Módulo 1 – SSO/Login/Usuário Master para implementação no CRM de Engenharia.
