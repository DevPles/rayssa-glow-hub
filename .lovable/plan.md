

# Plano: Revisao Completa do Prontuario Eletronico Gestacional

## Problema

O componente atual (`RegistroClinicoTab.tsx`) tem 1694 linhas em um unico arquivo, com fluxos desconectados entre si. Consultas solicitam exames que nao aparecem automaticamente na aba de exames. Nao ha alertas inteligentes. O Cartao da Gestante duplica dados das outras abas sem agregar valor. Falta uma linha do tempo unificada e um fluxo clinico coerente.

---

## Arquitetura: Dividir em Componentes

Extrair o arquivo monolitico em componentes menores dentro de `src/components/admin/clinical/`:

```text
clinical/
  ClinicalRecordList.tsx      -- Lista de fichas com busca e filtros
  ClinicalRecordForm.tsx      -- Formulario de nova ficha / edicao
  ClinicalRecordDetail.tsx    -- Container da ficha aberta (header + tabs)
  GestationalCard.tsx         -- Aba Cartao da Gestante (dados + graficos)
  ConsultationsTab.tsx        -- Aba Consultas com modal de realizar/detalhar
  ExamsTab.tsx                -- Aba Exames por trimestre
  VaccinesTab.tsx             -- Aba Vacinas com calendario
  TimelineTab.tsx             -- NOVA: Linha do tempo unificada
  AlertsPanel.tsx             -- NOVO: Painel de alertas inteligentes
  FilterableChart.tsx         -- Grafico SVG com filtros
  constants.ts                -- Vacinas, exames por trimestre, utils
```

O `RegistroClinicoTab.tsx` vira um orquestrador simples que importa esses componentes.

---

## 1. Painel de Alertas Inteligentes (AlertsPanel)

Exibido no topo da ficha, calcula automaticamente:

- **Exames atrasados**: compara exames esperados do trimestre atual com os ja realizados
- **Vacinas pendentes**: verifica quais recomendadas ainda nao foram aplicadas
- **Consultas vencidas**: proxima consulta agendada que ja passou da data
- **Riscos**: alerta de PA elevada, ganho de peso excessivo, edema +++
- **Marcos**: proximo ultrassom morfologico, TOTG, GBS

Cada alerta com icone, cor (vermelho/amarelo/verde) e acao direta (ex: "Solicitar exame" abre modal pre-preenchido).

---

## 2. Linha do Tempo Unificada (TimelineTab)

Nova aba que consolida TODOS os eventos em ordem cronologica:

- Consultas (com status e resumo clinico)
- Exames (com interpretacao)
- Vacinas aplicadas
- Alertas gerados

Cada item clicavel abre o modal de detalhes correspondente. Filtros por tipo de evento e por periodo (trimestre/mes).

---

## 3. Fluxo de Consulta Inteligente

Ao clicar "Realizar Consulta" em uma consulta agendada:

1. **Passo 1 - Sinais Vitais**: peso, PA, AU, BCF, edema (campos obrigatorios)
2. **Passo 2 - Avaliacao Clinica**: observacoes, apresentacao fetal, conduta
3. **Passo 3 - Exames**: sugestao automatica baseada na IG, com toggle para solicitar. Exames solicitados sao criados automaticamente na aba Exames com status "solicitado"
4. **Passo 4 - Prescricoes**: campo para receitas e orientacoes
5. **Passo 5 - Agendamento**: data da proxima consulta pre-calculada (intervalo padrao por IG: mensal ate 28s, quinzenal ate 36s, semanal apos)

Progresso visual com steps/stepper no modal.

---

## 4. Integracao Exames-Consultas

- Exames solicitados dentro da consulta devem ser automaticamente adicionados a aba de Exames com status "Solicitado"
- Na aba Exames, exames solicitados aparecem com badge "Aguardando resultado" e botao "Lancar resultado"
- Ao lancar resultado, o exame na consulta tambem atualiza o status para "realizado"
- Trimestre do exame e calculado automaticamente pela DUM + data do exame

---

## 5. Cartao da Gestante Redesenhado

Em vez de duplicar tabelas, o cartao tera:

- **Cabecalho**: dados demograficos, tipo sanguineo, GPA, classificacao de risco
- **Painel IG/DPP**: com barra de progresso visual da gestacao (0-42 semanas)
- **Graficos**: peso e AU com filtros inteligentes (ja existem, manter)
- **Resumo compacto**: ultimo peso, ultima PA, ultimo BCF (dados da consulta mais recente)
- **Checklist visual**: icones mostrando vacinas OK/pendente e exames OK/pendente por trimestre (sem repetir tabelas inteiras)
- **Plano de parto e apoio**: mantido como esta

---

## 6. Auto-calculos e Inteligencia

- **Intervalo entre consultas**: sugerir automaticamente proxima data baseado na IG (mensal < 28s, quinzenal 28-36s, semanal > 36s)
- **Trimestre automatico**: ao registrar exame, calcular trimestre pela DUM + data (nao exigir selecao manual)
- **Alertas de PA**: se PA >= 140/90, marcar consulta com badge de alerta
- **Ganho de peso**: calcular diferenca entre consultas e alertar se > 500g/semana
- **IMC gestacional**: calcular IMC atual (peso da ultima consulta / altura²) alem do pre-gestacional

---

## Detalhes Tecnicos

- Cada componente recebe via props: `record`, `onUpdate`, `igWeeks`, `dumDate`
- Constantes (vacinas, exames) extraidas para `constants.ts`
- Utils (calcIG, calcIMC, formatCPF, lookupCPF) extraidas para `constants.ts`
- Sem mudancas no Context (ClinicalRecordContext permanece igual)
- Sem mudancas no banco de dados
- Sem bibliotecas externas novas

---

## Ordem de Execucao

1. Criar `constants.ts` com tipos, constantes e utils
2. Criar `FilterableChart.tsx`
3. Criar `AlertsPanel.tsx`
4. Criar `TimelineTab.tsx`
5. Criar `GestationalCard.tsx` redesenhado
6. Criar `ConsultationsTab.tsx` com fluxo em steps e integracao de exames
7. Criar `ExamsTab.tsx` com auto-trimestre e status solicitado/realizado
8. Criar `VaccinesTab.tsx`
9. Criar `ClinicalRecordList.tsx` e `ClinicalRecordForm.tsx`
10. Criar `ClinicalRecordDetail.tsx` orquestrando tudo
11. Simplificar `RegistroClinicoTab.tsx` como wrapper

