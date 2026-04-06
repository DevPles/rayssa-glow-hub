
## Plano: Sistema de Acompanhamento de Gestante

### Escopo
Transformar textos, labels e funcionalidades do site para foco em **gestantes**, mantendo:
- ✅ Cores, imagens e layout atuais
- ✅ Sistema de agenda existente (BookingContext, AgendaTab, AgendamentosTab)
- ✅ Arquitetura multi-tenant

### Etapas

#### 1. Atualizar textos e labels da Landing Page
- Hero: textos para acompanhamento gestacional
- Seção de Serviços: renomear para serviços de gestante (pré-natal, parto, pós-parto, etc.)
- Depoimentos: adaptar para contexto materno
- Blog: manter estrutura, adaptar conteúdo mock

#### 2. Atualizar páginas de catálogo
- **Estética Avançada** → **Pré-Natal & Preparação**
- **Núcleo Materno** → manter e expandir com linha do tempo gestacional
- **Produtos & Programas** → **Loja de Produtos para Gestantes**
- **Parceria Rosangela** → avaliar se mantém ou redireciona

#### 3. Adicionar Linha do Tempo Gestacional
- Novo componente visual mostrando semanas de gestação
- Marcos importantes (exames, consultas, desenvolvimento fetal)
- Integrar ao registro clínico existente

#### 4. Adaptar Registro Clínico
- Foco em dados obstétricos (já existe `ObstetricEvaluation`)
- Expandir campos de acompanhamento gestacional
- Manter estrutura de prontuário

#### 5. Atualizar dados mock
- ServicesContext: serviços voltados para gestantes
- system_settings defaults: textos para o nicho

#### 6. Manter intacto
- Sistema de agenda (BookingContext, AvailabilityContext)
- Sistema de autenticação e roles
- Dashboard admin e financeiro
- Infraestrutura multi-tenant
