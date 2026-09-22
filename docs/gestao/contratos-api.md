# Contratos de API — Gestão — Sprint 1

Este documento define os contratos de API utilizados pelo módulo de **Gestão** na Sprint 1.

O escopo desta Sprint está concentrado em:

- autenticação e perfis básicos;
- cadastro e manutenção de educandos;
- responsáveis familiares;
- evoluções e atendimentos;
- encaminhamentos e seus acompanhamentos;
- agenda compartilhada.

Funcionalidades como atividades, encontros, frequência, indicadores, exportações, auditoria completa e administração completa de projetos/serviços/programas não fazem parte do contrato principal desta Sprint.

---

## Convenções

- Prefixo atual das rotas: `/api`.
- Requisições e respostas utilizam JSON.
- Datas devem ser enviadas em formato ISO 8601.
- Os identificadores utilizados atualmente pelo backend são inteiros (`Int`).
- Rotas protegidas utilizam JWT.
- O token deve ser enviado no cabeçalho:

```http
Authorization: Bearer <accessToken>
```

### Perfis existentes

- `COORDENACAO`
- `TECNICO_SERVICO_SOCIAL`
- `TECNICO_PSICOLOGIA`
- `EDUCADOR`
- `ADMINISTRATIVO`

Quando este documento utiliza **Técnicos**, refere-se a:

- `COORDENACAO`
- `TECNICO_SERVICO_SOCIAL`
- `TECNICO_PSICOLOGIA`

### Respostas de erro esperadas

| Código | Situação |
| --- | --- |
| `400` | Dados da requisição inválidos |
| `401` | Usuário não autenticado ou credenciais inválidas |
| `403` | Usuário autenticado sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito de regra de negócio, como possível duplicidade |

---

# 1. Autenticação

## POST `/api/auth/login`

Realiza a autenticação individual do usuário.

**Autenticação necessária:** não.

### Corpo

```json
{
  "email": "usuario@mdca.org.br",
  "senha": "senha-do-usuario"
}
```

### Resposta esperada

```json
{
  "accessToken": "jwt...",
  "usuario": {
    "id": 1,
    "nome": "Nome do usuário",
    "email": "usuario@mdca.org.br",
    "perfil": "TECNICO_SERVICO_SOCIAL"
  }
}
```

Usuários inativos não devem conseguir realizar novo login.

---

# 2. Usuários e perfis básicos

Os endpoints de usuários são requisitos de apoio da Sprint 1.

## GET `/api/usuarios`

Lista os usuários cadastrados.

**Perfis:** usuário autenticado.

---

## GET `/api/usuarios/:id`

Consulta um usuário específico.

**Perfis:** usuário autenticado.

---

## POST `/api/usuarios`

Cria um usuário.

**Perfis:** `COORDENACAO`.

### Corpo básico

```json
{
  "organizacaoId": 1,
  "nome": "Maria da Silva",
  "email": "maria@mdca.org.br",
  "senha": "senha-inicial",
  "perfil": "TECNICO_SERVICO_SOCIAL"
}
```

---

## PUT `/api/usuarios/:id`

Atualiza dados e/ou perfil de um usuário.

**Perfis:** `COORDENACAO`.

---

## PATCH `/api/usuarios/:id/inativar`

Inativa um usuário sem remover sua autoria dos registros históricos.

**Perfis:** `COORDENACAO`.

---

# 3. Educandos — US01

## GET `/api/educandos`

Lista e pesquisa educandos.

**Perfis:** qualquer usuário autenticado.

### Parâmetros de consulta

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `nome` | string | não | Pesquisa pelo nome |
| `apenasAtivos` | boolean | não | Por padrão retorna apenas ativos |

### Exemplo

```http
GET /api/educandos?nome=joao&apenasAtivos=true
```

> A listagem geral deve expor apenas os dados necessários ao perfil do usuário. Dados sensíveis devem ser revisados antes da conclusão da Sprint.

---

## GET `/api/educandos/:id`

Consulta os dados de um educando.

**Perfis:** Técnicos.

A resposta pode incluir os responsáveis familiares e o técnico responsável.

---

## POST `/api/educandos`

Cadastra um educando.

**Perfis:** Técnicos.

### Corpo atualmente suportado

```json
{
  "organizacaoId": 1,
  "nome": "João da Silva",
  "cpf": "00000000000",
  "rg": "0000000000",
  "nis": "00000000000",
  "corAutodeclarada": "Parda",
  "dataNascimento": "2012-05-10T00:00:00.000Z",
  "endereco": "Rua Exemplo, 123",
  "telefone": "51999999999",
  "escola": "Escola Exemplo",
  "turno": "Manhã",
  "historicoRepetencia": "Não",
  "numerosPessoasFamilias": 4,
  "rendaFamiliar": 1800,
  "beneficiosSociais": "Bolsa Família",
  "tipoMoradia": "Alugada",
  "doencaCronica": "Não",
  "medicamentoContinuo": "Não",
  "observacaoSaude": null,
  "tecnicoResponsavelId": 2
}
```

### Regra de duplicidade

Quando CPF e/ou NIS forem informados, o backend verifica possíveis cadastros duplicados.

Em caso de coincidência, deve responder com `409 Conflict`.

A ausência de CPF ou NIS não impede o cadastro.

### Ajustes previstos para a Sprint

O cadastro deve ser revisado para contemplar, conforme a modelagem definitiva:

- ano/série escolar;
- origem do encaminhamento;
- um ou mais motivos de ingresso.

---

## PUT `/api/educandos/:id`

Atualiza os dados cadastrais de um educando.

**Perfis:** Técnicos.

Os campos são os mesmos utilizados no cadastro, podendo ser enviados parcialmente conforme o DTO de atualização.

A validação de duplicidade por CPF/NIS também deve ser respeitada durante a alteração.

---

## PATCH `/api/educandos/:id/inativar`

Inativa o educando sem remover seu histórico.

**Perfis:** `COORDENACAO`.

---

## PATCH `/api/educandos/:id/reativar`

Reativa um educando anteriormente inativado.

**Perfis:** `COORDENACAO`.

Esta é uma operação auxiliar já disponível no backend.

---

# 4. Responsáveis familiares — US01

## GET `/api/responsaveis-familiares`

Lista os responsáveis familiares cadastrados.

**Autenticação:** obrigatória.

---

## GET `/api/responsaveis-familiares/:id`

Consulta um responsável familiar.

**Autenticação:** obrigatória.

---

## POST `/api/responsaveis-familiares`

Cadastra um responsável familiar associado a um educando.

**Autenticação:** obrigatória.

### Corpo

```json
{
  "educandoId": 1,
  "nome": "Maria da Silva",
  "cpf": "00000000000",
  "rg": "0000000000",
  "vinculo": "Mãe",
  "profissao": "Auxiliar administrativa",
  "tipoTrabalho": "Formal",
  "localTrabalho": "Empresa Exemplo",
  "escolaridade": "Ensino médio completo",
  "telefone": "51999999999"
}
```

---

## PUT `/api/responsaveis-familiares/:id`

Atualiza os dados de um responsável familiar.

**Autenticação:** obrigatória.

### Ponto a revisar

O backend atualmente possui exclusão física de responsável familiar.

Esse comportamento deve ser revisado antes de ser tratado como contrato definitivo, especialmente se o registro já estiver relacionado ao histórico do educando.

Por esse motivo, `DELETE /api/responsaveis-familiares/:id` **não é considerado parte do contrato oficial da Sprint 1 neste documento**.

---

# 5. Evoluções e atendimentos — US02

Todas as rotas de evolução exigem autenticação e perfil técnico.

## GET `/api/evolucoes?educandoId=:educandoId`

Retorna o histórico de evoluções de um educando.

**Perfis:** Técnicos.

### Exemplo

```http
GET /api/evolucoes?educandoId=15
```

O histórico deve ser retornado em ordem cronológica, priorizando os registros mais recentes.

---

## GET `/api/evolucoes/:id`

Consulta uma evolução específica.

**Perfis:** Técnicos.

---

## POST `/api/evolucoes`

Registra uma evolução ou atendimento.

**Perfis:** Técnicos.

O profissional responsável **não deve ser enviado pelo frontend**. Ele é obtido a partir do usuário autenticado.

### Corpo atualmente suportado

```json
{
  "educandoId": 15,
  "projetoId": 3,
  "titulo": "Atendimento individual",
  "tipo": "ATENDIMENTO",
  "descricao": "Registro do atendimento realizado.",
  "dataInicio": "2026-09-22T14:00:00.000Z",
  "dataFim": "2026-09-22T14:45:00.000Z",
  "situacao": "realizado"
}
```

`projetoId` é opcional nesta Sprint.

---

## PUT `/api/evolucoes/:id`

Atualiza uma evolução existente.

**Perfis:** Técnicos.

Não existe endpoint de exclusão física de evolução.

As evoluções fazem parte do histórico técnico e devem ser preservadas.

---

# 6. Encaminhamentos — US02

Todas as rotas desta seção exigem autenticação e perfil técnico.

## GET `/api/encaminhamentos?educandoId=:educandoId`

Lista os encaminhamentos de um educando.

**Perfis:** Técnicos.

A resposta inclui os acompanhamentos relacionados ao encaminhamento.

---

## GET `/api/encaminhamentos/:id`

Consulta um encaminhamento específico e seus acompanhamentos.

**Perfis:** Técnicos.

---

## POST `/api/encaminhamentos`

Registra um novo encaminhamento.

**Perfis:** Técnicos.

### Corpo atualmente suportado

```json
{
  "educandoId": 15,
  "evolucaoId": 27,
  "dataEncaminhamento": "2026-09-22T15:00:00.000Z",
  "situacaoAtual": "pendente"
}
```

### Ajuste obrigatório da Sprint

O requisito da Sprint determina que seja possível registrar **o conteúdo/descrição do encaminhamento realizado**.

O backend atual ainda não possui esse campo no DTO/modelo do encaminhamento.

O contrato final deverá passar a aceitar algo equivalente a:

```json
{
  "educandoId": 15,
  "evolucaoId": 27,
  "descricao": "Encaminhado para atendimento especializado.",
  "dataEncaminhamento": "2026-09-22T15:00:00.000Z",
  "situacaoAtual": "pendente"
}
```

Esse ajuste deve ser feito no banco/modelo, DTO e service antes da conclusão da US02.

Não existe `PUT` ou `DELETE` para o encaminhamento original, pois ele deve ser preservado.

---

# 7. Acompanhamento de encaminhamento — US02

Todas as rotas exigem autenticação e perfil técnico.

## GET `/api/acompanhamentos-encaminhamento?encaminhamentoId=:id`

Lista o histórico de acompanhamentos de um encaminhamento.

**Perfis:** Técnicos.

---

## GET `/api/acompanhamentos-encaminhamento/:id`

Consulta um acompanhamento específico.

**Perfis:** Técnicos.

---

## POST `/api/acompanhamentos-encaminhamento`

Registra uma nova atualização do encaminhamento sem sobrescrever o registro original.

**Perfis:** Técnicos.

### Corpo

```json
{
  "encaminhamentoId": 8,
  "situacao": "efetivado",
  "data": "2026-09-25T10:30:00.000Z",
  "observacao": "Família confirmou o atendimento."
}
```

Cada chamada cria um novo registro de acompanhamento.

O registro original do encaminhamento deve permanecer preservado.

---

# 8. Agenda compartilhada — US03

Todas as rotas de agenda exigem autenticação.

Não há restrição adicional de perfil no backend atual.

## GET `/api/compromissos`

Lista os compromissos.

Pode receber intervalo de datas.

### Parâmetros

| Parâmetro | Tipo | Obrigatório |
| --- | --- | --- |
| `inicio` | ISO 8601 | não |
| `fim` | ISO 8601 | não |

### Exemplo

```http
GET /api/compromissos?inicio=2026-09-01T00:00:00.000Z&fim=2026-09-30T23:59:59.999Z
```

As visões de dia, semana e mês devem utilizar essa mesma rota, variando o intervalo enviado pelo frontend.

---

## GET `/api/compromissos/:id`

Consulta um compromisso específico.

---

## POST `/api/compromissos`

Cria um compromisso.

O usuário criador é obtido automaticamente pelo JWT e não deve ser enviado pelo frontend.

### Corpo

```json
{
  "titulo": "Reunião de equipe",
  "tipo": "REUNIAO",
  "descricao": "Reunião semanal da equipe.",
  "dataInicio": "2026-09-23T14:00:00.000Z",
  "dataFim": "2026-09-23T15:00:00.000Z"
}
```

Ao criar, a situação é definida como `agendado`.

---

## PUT `/api/compromissos/:id`

Atualiza os dados de um compromisso.

---

## PATCH `/api/compromissos/:id/cancelar`

Cancela o compromisso sem removê-lo.

O backend altera sua situação para:

```text
cancelado
```

Compromissos cancelados permanecem no histórico e não devem ser tratados como realizados.

---

# 9. Rotas fora do contrato principal da Sprint 1

O backend pode conter estruturas e endpoints já iniciados para funcionalidades futuras.

Nesta Sprint, não são considerados parte do contrato principal:

- `/api/atividades`;
- `/api/encontros`;
- `/api/frequencias`;
- `/api/educando-projetos`;
- CRUD completo de `/api/projetos`;
- indicadores;
- exportação CSV/PDF;
- auditoria completa;
- importação de arquivos.

Essas estruturas podem permanecer no código como preparação, mas não fazem parte do critério de conclusão da Sprint 1.

---

# 10. Pontos pendentes antes de fechar a Sprint

Os principais pontos que ainda devem ser alinhados entre documentação, banco, backend e frontend são:

1. adicionar ano/série no cadastro do educando, caso confirmado pela modelagem;
2. implementar origem do encaminhamento e motivos de ingresso;
3. adicionar descrição/conteúdo ao encaminhamento;
4. revisar quais campos sensíveis podem aparecer na listagem geral de educandos;
5. revisar as permissões dos responsáveis familiares;
6. decidir o comportamento definitivo para remoção/inativação de responsáveis familiares;
7. garantir que usuário inativado não continue utilizando acesso indevido;
8. manter frontend e backend utilizando exatamente as rotas documentadas neste arquivo.

---

# Resumo do contrato da Sprint 1

```text
POST   /api/auth/login

GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PUT    /api/usuarios/:id
PATCH  /api/usuarios/:id/inativar

GET    /api/educandos
GET    /api/educandos/:id
POST   /api/educandos
PUT    /api/educandos/:id
PATCH  /api/educandos/:id/inativar
PATCH  /api/educandos/:id/reativar

GET    /api/responsaveis-familiares
GET    /api/responsaveis-familiares/:id
POST   /api/responsaveis-familiares
PUT    /api/responsaveis-familiares/:id

GET    /api/evolucoes?educandoId=:id
GET    /api/evolucoes/:id
POST   /api/evolucoes
PUT    /api/evolucoes/:id

GET    /api/encaminhamentos?educandoId=:id
GET    /api/encaminhamentos/:id
POST   /api/encaminhamentos

GET    /api/acompanhamentos-encaminhamento?encaminhamentoId=:id
GET    /api/acompanhamentos-encaminhamento/:id
POST   /api/acompanhamentos-encaminhamento

GET    /api/compromissos
GET    /api/compromissos/:id
POST   /api/compromissos
PUT    /api/compromissos/:id
PATCH  /api/compromissos/:id/cancelar
```

Este documento deve ser atualizado sempre que uma alteração de contrato for acordada entre frontend, backend e banco de dados.
