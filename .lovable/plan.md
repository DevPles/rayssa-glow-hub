

# Plano: Evolução Completa do Registro Clínico Gestacional

## Resumo

Cinco melhorias no módulo de Registro Clínico: cartão da gestante completo com gráficos e vacinas, consultas com modal de detalhes e dar baixa, exames por período com interpretação, filtro inteligente de profissional na nova ficha, e cálculos automáticos (IMC, CPF com preenchimento).

---

## 1. Cartão da Gestante Completo

**Problema:** O cartão atual só mostra dados estáticos básicos. Faltam gráficos de crescimento, vacinas e curva de ganho de peso.

**Solução:**
- Adicionar nova aba **"Vacinas"** no detail view com tabela de vacinas obrigatórias do pré-natal (Influenza, dTpa, Hepatite B, COVID-19) com campos: nome, dose, data aplicação, lote, profissional
- Adicionar campo `vaccines` ao tipo `ClinicalRecord` no contexto
- No cartão, adicionar seção **"Curva de Crescimento Fetal"**: gráfico simples (div com pontos plotados via CSS/inline) usando dados de altura uterina das consultas pré-natais ao longo das semanas
- Adicionar seção **"Curva de Ganho de Peso"**: gráfico com peso da gestante por consulta vs semana gestacional
- Os gráficos serão componentes simples usando `<svg>` inline (sem biblioteca externa)

**Arquivos:** `ClinicalRecordContext.tsx`, `RegistroClinicoTab.tsx`

---

## 2. Consultas com Modal de Detalhes e Dar Baixa

**Problema:** Clicar na consulta não abre nada. Não é possível dar baixa ou realizar consulta.

**Solução:**
- Adicionar campo `status` à interface `PrenatalConsultation`: `"agendada" | "realizada" | "cancelada"`
- Ao clicar em uma consulta na lista, abrir **modal de detalhes** mostrando todos os dados da consulta
- No modal: botão **"Realizar Consulta"** que permite preencher/editar os campos clínicos (peso, PA, AU, BCF, etc.) e marcar como "realizada"
- Botão **"Cancelar Consulta"** para marcar como cancelada
- Na lista de consultas, exibir badge de status (agendada/realizada/cancelada)
- Adicionar função `updatePrenatalConsultation` no contexto

**Arquivos:** `ClinicalRecordContext.tsx`, `RegistroClinicoTab.tsx`

---

## 3. Exames por Período com Rastreabilidade e Interpretação

**Problema:** Exames não seguem protocolo por trimestre, sem interpretação clínica.

**Solução:**
- Organizar exames em **3 seções por trimestre** (1º: até 13s, 2º: 14-27s, 3º: 28s+) com lista dos exames esperados em cada período
- Adicionar campos à interface `GestationalExam`: `trimester`, `interpretation` (normal/alterado/inconclusivo), `referenceValues`, `requestedBy`, `laboratory`
- Na aba de exames, mostrar checklist visual de exames pendentes vs realizados por trimestre
- Ao registrar exame: campo de **interpretação** (select: Normal, Alterado, Inconclusivo), **valores de referência** (texto), **laboratório** e **profissional solicitante**
- Ao clicar em exame existente, abrir modal com detalhes completos

**Arquivos:** `ClinicalRecordContext.tsx`, `RegistroClinicoTab.tsx`

---

## 4. Filtro Inteligente de Profissional na Nova Ficha

**Problema:** Seleção de profissional não filtra por categoria e obriga seleção mesmo com um só profissional.

**Solução:**
- Na tela de nova ficha, adicionar **Select de categoria** primeiro: "Médico(a) Obstetra", "Enfermeiro(a) Obstetra", "Todos"
- Filtrar lista de profissionais pela categoria selecionada (usando campo `role` ou novo campo do mock de usuários)
- Se após o filtro houver **apenas 1 profissional**, selecioná-lo automaticamente sem exigir clique
- Se houver múltiplos, exibir lista para seleção manual como já funciona
- Remover o texto "(Admin)" e "(Afiliada)" dos botões de profissional

**Arquivos:** `RegistroClinicoTab.tsx`, `AuthContext.tsx` (adicionar campo `specialty` ao MockUser se necessário)

---

## 5. Cálculos Automáticos e Busca por CPF

**Problema:** IMC e outros campos calculáveis são manuais. Não há busca por CPF.

**Solução:**
- **IMC automático**: ao preencher peso e altura no cartão gestacional, calcular IMC automaticamente (`peso / altura²`) e preencher o campo
- **IG automática**: ao preencher DUM, calcular e exibir IG atual automaticamente (já existe parcialmente)
- **CPF como primeiro campo**: reorganizar formulário para que CPF seja o primeiro campo de identificação
- Adicionar campo `cpf` ao tipo `ClinicalRecord`
- Ao digitar CPF completo (11 dígitos), simular busca (mock) e preencher nome, data nascimento e endereço automaticamente com dados fictícios
- Exibir botão "Editar dados" que desbloqueia os campos preenchidos para edição manual
- Máscara de CPF no input (XXX.XXX.XXX-XX)

**Arquivos:** `ClinicalRecordContext.tsx`, `RegistroClinicoTab.tsx`

---

## Detalhes Técnicos

- Todos os dados permanecem em memória (Context), sem alterações no banco
- Gráficos SVG inline simples, sem dependência de bibliotecas de chart
- Vacinas com lista pré-definida do calendário vacinal da gestante (MS)
- Exames por trimestre seguem protocolo padrão do Ministério da Saúde
- A busca por CPF será simulada (mock) retornando dados fictícios

