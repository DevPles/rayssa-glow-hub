# Plano: Filtro por Profissional no Registro Clínico

## Problema

Atualmente, o registro clínico não associa pacientes a profissionais (médico/enfermeiro obstetra). Todos os usuários admin veem todas as fichas. O sistema precisa:

1. Vincular cada paciente a um profissional responsável
2. Filtrar automaticamente as fichas pelo profissional logado
3. Permitir selecionar o profissional ao cadastrar/editar uma ficha

## Alterações

### 1. ClinicalRecordContext.tsx

- Adicionar campo `assignedProfessionalId` e `assignedProfessionalName` ao tipo `ClinicalRecord` e ao `createEmptyRecord`
- Atualizar o mock record existente com um profissional atribuído (ex: id "1b", "Admin Rayssa")

### 2. RegistroClinicoTab.tsx

- Adicionar um **Select de "Profissional Responsável"** no formulário de criação/edição, listando usuários com role `admin` ou `afiliada` (profissionais)
- Adicionar um **filtro por profissional** na lista (dropdown ao lado da busca)
- **Filtro automático**: quando o usuário logado for `admin` (não `super_admin`), filtrar automaticamente para mostrar apenas seus pacientes, com opção de ver todos
- `super_admin` vê todos por padrão com filtro opcional
- Exibir o nome do profissional responsável no card da lista e no cabeçalho do detalhe  
paciente pode ter mais de um profissional por exemplo, pode ter mais de um medico ou enfermeiro 

### 3. Fluxo de uso

- Ao criar ficha: campo obrigatório "Profissional Responsável" (Select com lista de admins/afiliadas)
- Na lista: filtro dropdown "Profissional" + busca por nome
- Admin logado: vê apenas seus pacientes por padrão
- Super Admin: vê todos, pode filtrar por profissional

## Detalhes Técnicos

- O campo `assignedProfessionalId` referencia o `id` do `MockUser`
- Filtro usa `useAuth()` para obter `user.id` e `user.role`
- Sem alterações no banco de dados (dados em memória via Context)
- KPIs ajustados para refletir apenas os registros filtrados