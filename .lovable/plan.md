
# CPF sem trazer dados reais — Diagnóstico e Solução

## Diagnóstico

Analisando os logs da edge function, o fluxo atual é:

1. **Consultar.io** — Pula porque não há `CPF_API_TOKEN` configurado
2. **BrasilAPI** — Endpoint `/api/cpf/v1/` está **desativado/depreciado** (retorna erro)
3. **SUS** — Valida que o CPF existe (retorna `true`), mas **não retorna nome nem dados pessoais**
4. **AI (Gemini)** — Gera dados **fictícios** como fallback → é isso que está aparecendo ("Francisca Silva Lima" é inventado)

O problema é que **não existe API gratuita no Brasil que retorne dados reais de CPF** (nome, nascimento) devido à LGPD. A BrasilAPI desativou esse endpoint há tempo.

## Soluções disponíveis

### Opção A — Configurar API paga (recomendado)
Configurar um token de API de um serviço de consulta de CPF como:
- **Consultar.io** (já implementado no código, só falta o token)
- **ReceitaWS** (plano pago)
- **InfoSimples** ou **HubDev**

O código já suporta Consultar.io — basta adicionar o secret `CPF_API_TOKEN`.

### Opção B — Melhorar o fallback atual
Manter o fluxo sem API paga, mas:
1. Remover a mensagem enganosa "Dados encontrados!" quando os dados são simulados
2. Mostrar claramente "Dados simulados — preencha manualmente" quando vem do AI
3. Manter os campos editáveis para preenchimento manual
4. Usar a validação SUS para confirmar que o CPF é real

## Plano de Implementação (Opção B + suporte à Opção A)

### Arquivo 1: `supabase/functions/cpf-lookup/index.ts`
- Remover tentativa com BrasilAPI (endpoint morto, só atrasa)
- No response, incluir campo `source` com valor claro: `"api_real"`, `"sus_validated_simulated"`, `"simulated"`

### Arquivo 2: `src/components/admin/clinical/constants.ts`
- Retornar o campo `source` junto com os dados na função `lookupCPF`

### Arquivo 3: `src/components/admin/clinical/ClinicalRecordForm.tsx`
- Quando `source` é `"simulated"` ou `"sus_validated_simulated"`: mostrar toast "CPF válido — dados de preenchimento automático. Confira e corrija se necessário." em vez de "Dados encontrados!"
- Quando `source` é `"api_real"`: mostrar "Dados da Receita Federal encontrados!"
- Manter campos sempre editáveis após preenchimento simulado

### Arquivo 4 (opcional): Adicionar secret `CPF_API_TOKEN`
- Se o usuário fornecer uma chave de API (Consultar.io), configurar como secret para ativar dados reais automaticamente
