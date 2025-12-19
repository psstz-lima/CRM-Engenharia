# Módulo 2 – Contratos  
CRM de Engenharia – Especificação Técnica

---

## 1. Objetivo do módulo

O módulo de **Contratos** tem como finalidade registrar, organizar e controlar contratos de engenharia, incluindo:

- Dados gerais do contrato
- Estrutura hierárquica de itens, subitens e serviços
- Controle de quantidades, preços unitários e valores
- Controle completo de **aditivos** (quantidade, preço, inclusão de novos serviços)
- Disponibilização dos serviços contratados para o módulo de medições

---

## 2. Regras de integração com o sistema

O módulo de contratos deve se conectar com:

- **Dashboard** pós-login  
  - Total de contratos ativos  
  - Contratos a vencer  
  - Valor total atualizado dos contratos  

- **Controle de acesso (SSO)**  
  - Somente usuários com permissão podem criar/editar contratos  
  - Usuários clientes podem visualizar apenas contratos da própria empresa  

---

## 3. Cadastro básico do contrato

Cada contrato deve possuir os seguintes campos mínimos:

- **Número do contrato** (obrigatório)
- **Empresa vinculada** (obrigatório, selecionada do cadastro de empresas)
- **Data de início** (obrigatório)
- **Data de fim** (obrigatório)

Após salvar:

- O contrato torna‑se editável
- Ao clicar no contrato, o sistema abre diretamente a aba **Itens do Contrato**

---

## 4. Estrutura hierárquica do contrato

O módulo deve permitir construção de escopo técnico organizado em três níveis:

### Nível 1 – Item
- Sempre vinculado ao contrato
- Não possui quantidade ou preço
- Agrupa Subitens ou Itens (serviços)

### Nível 2 – Subitem (opcional)
- Vinculado a um Item
- Não possui quantidade ou preço
- Usado apenas quando for necessário agrupar serviços

### Nível 3 – Item (serviço)
- É o nível medido
- Pode ser vinculado diretamente a um Item ou a um Subitem
- Possui quantidade, unidade, preço e valor

Regras:

- Não pode existir Subitem sem Item pai
- Não pode existir Item (serviço) sem Item ou Subitem pai
- Caso exista medição lançada, o serviço não pode ser excluído; apenas inativado

---

## 5. Campos do Item (serviço)

O Item (serviço) é a unidade de medição e faturamento do contrato.  
Os seguintes campos são obrigatórios ou opcionais:

### 5.1 Campos textuais
- **Código do serviço** – obrigatório  
- **Descrição do serviço** – opcional  
- **Observações técnicas** – opcional  
- (Opcional) Grupo/Disciplina  
- (Opcional) Referência externa (SINAPI, TCPO etc.)  
- (Opcional) Critério de medição  

### 5.2 Vínculos
- Contrato  
- Item pai  
- Subitem pai (se usado)  
- **Centro de custo** – obrigatório  

### 5.3 Quantitativos e valores
- **Unidade de medida** (obrigatória, retirada do cadastro padronizado)  
  - Deve utilizar formato sem expoentes: m, m2, m3, un, kg, h
- **Quantidade contratada**
  - 3 casas decimais
  - Separador decimal: vírgula
  - Ex.: 125,750
- **Preço unitário**
  - Formato monetário R$
  - Separador decimal: vírgula  
- **Valor total**
  - Calcular automaticamente:  
    Valor total = Quantidade × Preço Unitário  

---

## 6. Cadastro padronizado de unidades

O sistema deve possuir tabela de **Unidades de Medida**, com códigos padronizados:

- m  
- m2  
- m3  
- un  
- kg  
- h  
- outros necessários

Regras:

- Campo de unidade no Item (serviço) só aceita unidades cadastradas
- Unidades com expoente devem sempre ser escritas como m2, m3, etc. (sem caracteres especiais)

---

## 7. Sistema de Aditivos

O módulo deve permitir criação de **múltiplos aditivos**, cada um representando alterações formais no contrato.

### 7.1 Regra principal
Cada novo aditivo deve partir sempre do **estado atualizado do contrato**, incluindo todos os aditivos aprovados anteriormente.

### 7.2 Tipos de aditivos
Um aditivo pode realizar:

1. **Alteração de quantidade**  
2. **Alteração de preço unitário**  
3. **Alteração de ambos simultaneamente**  
4. **Inclusão de novos Itens / Subitens / Itens (serviços)**

### 7.3 Campos do cabeçalho do aditivo
- Número do aditivo  
- Tipo (quantidade, preço, misto, inclusão)  
- Data do aditivo  
- Justificativa técnica  
- Responsável  

### 7.4 Status do aditivo
- Rascunho  
- Em análise  
- Aprovado (passa a integrar o contrato)  
- Rejeitado  

### 7.5 Alterações de quantidade

Para cada serviço afetado:

- Quantidade vigente antes do aditivo (somente leitura)  
- Δ Quantidade (positiva ou negativa)  
- Quantidade atual após aditivo  

Valor do aditivo quando somente quantidade muda:

Valor aditivo = Δ Quantidade × Preço unitário vigente

Regra:

- Quantidade resultante nunca pode ser inferior à quantidade já medida

### 7.6 Alterações de preço unitário

Campos:

- Preço vigente antes do aditivo  
- Novo preço unitário (opcional – se vazio, PU permanece igual)  

Impacto financeiro quando somente PU muda:

Valor aditivo = Quantidade vigente × (PU novo – PU antigo)

### 7.7 Alterações simultâneas

O sistema deve calcular:

Valor antes = Qtd vigente × PU antigo  
Valor depois = Qtd atual × PU novo  
Valor aditivo = Valor depois – Valor antes  

### 7.8 Inclusão de novos serviços via aditivo

O aditivo deve permitir criação de:

- Novos Itens (Nível 1)  
- Novos Subitens (Nível 2)  
- Novos Itens (serviços – Nível 3)  

Todos os novos serviços devem ficar marcados como “Criado pelo Aditivo X”.

---

## 8. Interação com o módulo de Medições

- Medições sempre se referem ao Item (serviço)
- Quantidade disponível para medir depende de:
  - Quantidade total atualizada (contrato + aditivos aprovados)
  - Quantidade já medida

Saldo a medir = Quantidade atual – Quantidade medida

Regras:

- Alterações de PU não alteram medições passadas  
- Novo PU aplica‑se apenas ao saldo a medir  
- Serviços criados em aditivos aprovados devem imediatamente aparecer para medição  

---

## 9. Sugestões inteligentes (melhorias)

O módulo deve sugerir automaticamente:

- Estrutura de itens/subitens com base em contratos anteriores  
- Código automático para serviços  
- Unidade de medida provável com base nas palavras da descrição  
  - “área” → m2  
  - “escavação” → m3  
- Centro de custo mais utilizado para itens semelhantes  
- Criação de aditivo ao identificar mudanças grandes de quantidade ou PU  
- Critério de medição conforme unidade  

---

## 10. Encerramento do módulo

Este arquivo apresenta toda a especificação consolidada do **Módulo 2 – Contratos**, pronto para implementação no CRM de Engenharia.

