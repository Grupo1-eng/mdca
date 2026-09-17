# Contratos de API — Gestão

Endpoints do módulo de gestão, sob o prefixo `/gestao`. Este documento existe para o frontend poder trabalhar em paralelo ao backend: o contrato é acordado primeiro, a implementação vem depois.

Todas as rotas exigem autenticação. A coluna "Perfis" indica quem acessa cada rota nesta sprint (checagem por perfil apenas — ver `escopo-sprint1.md`).

Perfis: `COORDENACAO`, `TECNICO_SERVICO_SOCIAL`, `TECNICO_PSICOLOGIA`, `EDUCADOR`, `ADMINISTRATIVO`.

## Educando (RF01–RF05)

| Método | Rota | Descrição | Perfis |
| --- | --- | --- | --- |
| `POST` | `/gestao/educandos` | Cadastra educando. Aceita lista de motivos de ingresso e, opcionalmente, situação socioeconômica e saúde. | Coordenação, Técnicos |
| `GET` | `/gestao/educandos` | Lista e pesquisa. Filtros: `nome`, `programaId`, `ativo`. | Todos |
| `GET` | `/gestao/educandos/:id` | Consulta individual. Dados sensíveis conforme perfil. | Coordenação, Técnicos |
| `PATCH` | `/gestao/educandos/:id` | Atualização parcial dos dados cadastrais. | Coordenação, Técnicos |
| `PATCH` | `/gestao/educandos/:id/inativar` | Inativa preservando histórico (RN01). | Coordenação |
| `POST` | `/gestao/educandos/:id/responsaveis` | Vincula responsável familiar, com o tipo de vínculo. | Coordenação, Técnicos |

A verificação de duplicidade (RF03/RN02) acontece no `POST`: quando CPF ou NIS são informados e já existem, a resposta sinaliza a coincidência antes da confirmação.

## Evolução (RF06–RF08)

| Método | Rota | Descrição | Perfis |
| --- | --- | --- | --- |
| `POST` | `/gestao/educandos/:id/evolucoes` | Registra atendimento. O profissional responsável vem do usuário autenticado (RN03). | Coordenação, Técnicos |
| `GET` | `/gestao/educandos/:id/evolucoes` | Histórico cronológico, mais recente primeiro. | Coordenação, Técnicos |
| `PATCH` | `/gestao/evolucoes/:id/efetivacao` | Registra a efetivação do encaminhamento, sem alterar o registro original (RN04). | Coordenação, Técnicos |

## Agenda (RF09, RF10)

| Método | Rota | Descrição | Perfis |
| --- | --- | --- | --- |
| `POST` | `/gestao/compromissos` | Cria compromisso. Responsável é o usuário autenticado. | Todos |
| `GET` | `/gestao/compromissos` | Lista por intervalo. Parâmetros obrigatórios: `inicio`, `fim` (ISO 8601). | Todos |
| `PATCH` | `/gestao/compromissos/:id` | Edita título, data/hora e observações. | Todos |
| `PATCH` | `/gestao/compromissos/:id/cancelar` | Cancela mantendo no histórico (RN05). | Todos |

As visões de dia, semana e mês (RF10) usam o mesmo endpoint de listagem, variando o intervalo: o agrupamento é responsabilidade do frontend.

## Atividades, encontros e frequência (RF17–RF19)

| Método | Rota | Descrição | Perfis |
| --- | --- | --- | --- |
| `POST` | `/gestao/atividades` | Cria atividade vinculada a uma iniciativa e a um responsável. | Coordenação, Educador |
| `GET` | `/gestao/atividades` | Lista atividades. Filtro por `programaId`. | Todos |
| `POST` | `/gestao/atividades/:id/encontros` | Cria encontro da atividade. | Coordenação, Educador |
| `POST` | `/gestao/encontros/:id/frequencia` | Registra presença/ausência em lote. Upsert por participante (RN06). | Coordenação, Educador |
| `GET` | `/gestao/educandos/:id/frequencia` | Histórico de participação do educando. | Todos |

O registro de frequência recebe uma lista de participantes (educando, presença, observação opcional), não um participante por requisição: o educador registra a chamada inteira de uma vez.

## Iniciativas (RF20, RF21)

| Método | Rota | Descrição | Perfis |
| --- | --- | --- | --- |
| `POST` | `/gestao/iniciativas` | Cadastra projeto, serviço ou programa. | Coordenação |
| `GET` | `/gestao/iniciativas` | Lista iniciativas. Filtro por `tipo` e `situacao`. | Todos |

Rota sujeita a mudança: se o financeiro também precisar manter iniciativas, este recurso sai do prefixo `/gestao` e vira compartilhado. Ver `perguntas-em-aberto.md`.

## Painel (RF15, RF16)

| Método | Rota | Descrição | Perfis |
| --- | --- | --- | --- |
| `GET` | `/gestao/indicadores` | Indicadores consolidados. Filtros: `inicio`, `fim`, `programaId`. | Coordenação, Administrativo |
| `GET` | `/gestao/indicadores/exportar` | Exporta os dados filtrados. Parâmetro `formato`: `csv` ou `pdf`. | Coordenação, Administrativo |

Os indicadores mínimos são educandos atendidos, atendimentos registrados, encontros realizados e frequência média — os dois primeiros sempre como números distintos (RN08).

## Convenções

- Corpo e resposta em JSON; datas em ISO 8601.
- Identificadores em UUID.
- Erros de regra de negócio retornam `409` com mensagem descritiva; falta de permissão retorna `403`; recurso inexistente, `404`.
- Nenhum endpoint de exclusão física em nenhum recurso desta lista.
