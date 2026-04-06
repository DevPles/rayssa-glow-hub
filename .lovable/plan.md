

# Plataforma Rayssa Leslie Estética e Saúde da Mulher

## Fase 1: Fundação e Landing Page
Configurar o design system da marca (cores, tipografia Poppins/Lato, componentes base) e construir a landing page completa com:
- **Hero Section** com headline, CTAs e gradiente rosa/roxo
- **Seção de Serviços** com 3 cards (Estética Mulheres, Gestantes, Produtos+Cursos)
- **Seção de Depoimentos** em carrossel
- **Seção de Blog/Artigos** com 3 cards de exemplo
- **Header** com navegação responsiva (menu hambúrguer no mobile)
- **Footer** com 4 colunas (Sobre, Links, Contato, Redes Sociais)
- Dados mock para todo o conteúdo

## Fase 2: Página de Serviços
- Grid de serviços com filtros (categoria, preço, ordenação)
- Cards com imagem, preço, duração, avaliação e CTAs
- Página de detalhes do serviço (2 colunas: galeria + info + produtos recomendados)
- Dados mock com os 21 serviços listados (Estética Mulheres + Gestantes)

## Fase 3: Loja de Produtos + Carrinho
- Grid de produtos com filtros avançados (categoria, preço, marca, avaliação)
- Página de detalhes do produto (galeria com zoom, especificações, reviews)
- Carrinho de compras funcional (adicionar/remover, quantidade, cupom de desconto)
- Checkout em 3 passos (Entrega → Pagamento → Revisão)
- Página de confirmação de pedido
- Dados mock com cosméticos, semijoias, artigos gestantes e kits

## Fase 4: Autenticação e Perfil (requer Lovable Cloud/Supabase)
- Páginas de Login, Registro, Recuperação e Redefinição de senha
- Tipos de conta: Cliente, Afiliada, Instrutora
- Dashboard do usuário com abas: Dados Pessoais, Agendamentos, Pedidos, Cursos, Favoritos, Configurações

## Fase 5: Sistema de Agendamento
- Fluxo em 4 passos: Selecionar Serviço → Data/Horário → Produtos Recomendados (venda casada) → Confirmação
- Calendário interativo com horários disponíveis
- Histórico de agendamentos no perfil

## Fase 6: Página de Cursos + Plataforma de Aprendizado
- Catálogo com filtros (nível, duração, preço)
- Página de detalhes com vídeo preview, módulos e instrutor
- Plataforma de aprendizado com sidebar, vídeo player, progresso e materiais
- 5 cursos de exemplo

## Fase 7: Programa de Afiliados
- Landing page com benefícios e tabela de níveis (Bronze→Diamante)
- Formulário de cadastro em 3 passos
- Dashboard de afiliada com gráficos de vendas, comissões, links e clientes

## Fase 8: Integrações de Pagamento e Notificações
- Integração Stripe para cartão de crédito/débito
- Fluxo de PIX e boleto
- Notificações por email (confirmações, lembretes)

## Notas Técnicas
- **Design**: Mobile-first, dark mode, animações suaves, skeletons de loading
- **Backend**: Será necessário conectar Lovable Cloud ou Supabase para autenticação, banco de dados e edge functions
- **Dados**: Começaremos com dados mock e substituiremos por dados reais conforme o backend for integrado
- **A loja de produtos físicos** pode usar integração Shopify como alternativa ao checkout customizado

