

# Redesign do Registro Clínico — Cards + Backend

## Problema Atual

1. **Layout confuso com abas**: 6 abas (Cartão, Timeline, Consultas, Exames, Vacinas, Dados) escondem informações e dificultam a visão geral
2. **Sem backend**: Todos os dados clínicos estão apenas no localStorage (contexto React). Se o navegador limpar cache, tudo é perdido
3. **Sem integração real**: Inputs de consultas, exames e vacinas não persistem no banco de dados

## Solução

### Parte 1 — Criar tabelas no banco de dados

Criar 4 tabelas com RLS:

- **clinical_records** — dados do paciente e cartão gestacional (campos JSON para gestationalCard e vitalSigns)
- **prenatal_consultations** — consultas vinculadas ao registro (foreign key para clinical_records)
- **gestational_exams** — exames vinculados ao registro
- **vaccines** — vacinas vinculadas ao registro

Todas com `tenant_id` e políticas de segurança para usuários autenticados.

### Parte 2 — Redesign do ClinicalRecordDetail (Cards em vez de Abas)

Substituir as 6 abas por uma página de scroll contínuo com cards empilhados no estilo glassmorphism (mesmo padrão dos POPs):

```text
┌─────────────────────────────────────┐
│  Header: Paciente + Stats rápidos   │
├─────────────────────────────────────┤
│  Card: Alertas (se houver)          │
├─────────────────────────────────────┤
│  Card: Cartão Gestacional           │
│  (DUM, DPP, tipo sanguíneo, etc)   │
├─────────────────────────────────────┤
│  Card: Dados Pessoais               │
│  (CPF, telefone, endereço, etc)     │
├─────────────────────────────────────┤
│  Card: Consultas Pré-Natal          │
│  (lista + botão "Nova Consulta")    │
├─────────────────────────────────────┤
│  Card: Exames                       │
│  (lista + botão "Novo Exame")       │
├─────────────────────────────────────┤
│  Card: Vacinas                      │
│  (lista + botão "Nova Vacina")      │
├─────────────────────────────────────┤
│  Card: Timeline                     │
│  (cronologia unificada)             │
└─────────────────────────────────────┘
```

Cada card terá:
- Título com contador (ex: "Consultas (3)")
- Estado colapsável (expandir/recolher) para não sobrecarregar a tela
- Botão de ação no canto superior direito
- Estilo `bg-white/40 backdrop-blur-xl border-white/50 shadow-lg`

### Parte 3 — Integrar Context com Supabase

Atualizar o `ClinicalRecordContext.tsx` para:
- Carregar dados do banco ao montar
- Salvar no banco ao adicionar/atualizar/remover consultas, exames e vacinas
- Manter fallback no localStorage para offline

### Arquivos Modificados

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar 4 tabelas + RLS |
| `ClinicalRecordContext.tsx` | CRUD via Supabase |
| `ClinicalRecordDetail.tsx` | Remover Tabs, usar cards colapsáveis |
| `ConsultationsTab.tsx` | Adaptar para funcionar como seção dentro de card |
| `ExamsTab.tsx` | Idem |
| `VaccinesTab.tsx` | Idem |
| `GestationalCard.tsx` | Idem |
| `TimelineTab.tsx` | Idem |

