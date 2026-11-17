# Plano: atividades, encontros e frequência (Sprint 4)

Situação em 2026-11-17: **implementado** (etapas 1 a 4), testado pelo usuário no navegador. Decisões 2 e 3 fechadas em 2026-11-17; a 1 segue em aberto, com a opção recomendada aplicada provisoriamente (`aceitaChamada` em `backend/src/modules/gestao/atividades/regras-atividades.ts` e `frontend/.../gestao/atividades/model.ts`).

- Branch: `feature/gestao-atividades-frequencia`, criada a partir da `main` depois dos PRs #30 a #34.
- Origem: apresentação da Sprint 3 (05/11), slide "Evolução do módulo Gestão", item "Atividades, encontros e frequência no banco"; slide "Requisitos priorizados e novas rotas": atividades e responsáveis, encontros (cancelar sem apagar), chamada de presença por encontro, histórico de frequência na ficha.
- Requisitos: RF17 (atividades e encontros), RF18 (presença por encontro), RF19 (histórico de frequência), RF21 (vínculo com a iniciativa), RN05 (cancelado não conta como realizado), RN06 (uma frequência vigente por educando por encontro).

## O que já existe

- Banco: os modelos `Atividade`, `Encontro` e `Frequencia` já existem no Neon (schema `gestao`), com o índice único `frequencia(encontro_id, educando_id)` (RN06). **Não precisa de migration.**
- Frontend: `src/modules/gestao/atividades/AtividadesPage.tsx` (listagem e cadastro) e `educandos/components/FrequenciaPanel.tsx` (aba da ficha) funcionam com dados de exemplo.
- Vínculo educando–iniciativa e `GET /api/iniciativas` já existem (PR #30); a chamada depende deles.
- Referência (não usável direto, sem organização nem perfis): `../mdca-backend-sprint1/mdca-backend/src/modules/gestao/{atividades,encontros,frequencias}`, com DTOs e a chamada em lote por upsert. Tela de referência: `frontend/SistemaGestao/src/routes/atividades.$id.tsx`.

## Regras gerais

- Todos os perfis da Gestão consultam (`PERFIS_GESTAO`); coordenação e educador gravam (`PERFIS_REGISTRO_ATIVIDADES` em `backend/src/modules/gestao/perfis-gestao.ts`). Técnicos e administrativo só consultam.
- A organização é verificada pela iniciativa: atividade → projeto → `organizacaoId`. Registro de outra organização responde 404.
- Sem rotas de exclusão.
- O responsável da atividade é um usuário (coordenação ou educador) da organização, escolhido numa lista.
- A chamada só inclui educandos ativos vinculados à iniciativa da atividade.

## Etapa 1: backend de atividades

- `GET /api/atividades/responsaveis`: usuários ativos da organização com perfil `coordenador` ou `educador` (id e nome).
- `GET /api/atividades` (filtros `projetoId` e `situacao`), `GET /api/atividades/:id`, `POST /api/atividades`, `PUT /api/atividades/:id`.
- Validações: iniciativa da organização; responsável ativo, da organização e com perfil permitido.
- Situação no banco `ativa`/`encerrada`; na tela, Ativa/Encerrada.

## Etapa 2: backend de encontros

- `GET /api/encontros?atividadeId=`, `GET /api/encontros/:id`, `POST /api/encontros`, `PUT /api/encontros/:id`.
- Situações: Planejado, Realizado, Cancelado (no banco `agendado`, `realizado`, `cancelado`; `agendado` é o padrão do schema).
- Cancelar não apaga; cancelado não conta como realizado (RN05).
- Data guardada só como dia (`dataInicio`) e horário como texto `HH:MM` (`horaInicio`), para não repetir o problema de fuso do atendimento.

## Etapa 3: backend de frequência

- `GET /api/frequencias/encontro/:id`: lista da chamada. Educandos ativos vinculados à iniciativa da atividade, com a presença já gravada, mais quem já tem presença registrada no encontro mesmo que tenha sido desvinculado depois.
- `PUT /api/frequencias/encontro/:id`: grava a chamada inteira numa transação; regravar atualiza em vez de duplicar (RN06). Educando fora da lista é recusado.
- `GET /api/frequencias/educando/:id`: histórico do educando, com encontro e atividade.

## Etapa 4: frontend

- Chamadas e conversões: `api/atividades.ts`, `api/encontros.ts`, `api/frequencias.ts`, cada uma com mapper puro e testes (mesmo padrão de `api/educandos.ts`).
- `AtividadesPage` com dados reais; responsável escolhido numa lista em vez de texto livre.
- Rota nova `/gestao/atividades/:id`: encontros da atividade (criar, editar, mudar situação) e chamada.
- Aba de frequência da ficha com histórico real e taxa de presença.
- Remover o código de exemplo: `iniciativasDemonstracao`, `iniciativaDemonstracaoNome`, seeds de atividades e encontros, `salvarAtividadeEmMemoria`.

## Fora deste plano

- Indicadores do Dashboard (próximo item da Sprint 4: painel com indicadores reais e filtros).
- Auditoria das gravações da Gestão (RF13).

## Testes e commits

- Testes unitários em cada etapa; no fim, teste de ponta a ponta com Postgres descartável e duas organizações; depois, teste no navegador.
- Dois commits, cada um só com aprovação: backend (etapas 1 a 3) e frontend (etapa 4).

## Decisões em aberto

O usuário quer esclarecer estas perguntas antes de decidir.

1. **Quando a chamada pode ser registrada.** Em 2026-11-17 o usuário decidiu deixar em aberto por ora. Não bloqueia as etapas 1 e 2; na etapa 3, manter a regra isolada num só lugar para trocar fácil. Opções: (a) em qualquer encontro não cancelado, sem mudar a situação sozinho (recomendado); (b) só em encontro já marcado como Realizado; (c) salvar a chamada marca o encontro como Realizado.
2. **Alcance do educador.** Decidido em 2026-11-17: (a), grava em qualquer atividade da organização. Opções: (a) grava em qualquer atividade da organização (recomendado, igual à regra já combinada); (b) só nas atividades em que é o responsável; a coordenação grava em todas.
3. **Atividade encerrada.** Decidido em 2026-11-17: (a), não aceita encontros novos, mas pode voltar para Ativa. Opções: (a) não aceita encontros novos, mas pode voltar para Ativa (recomendado); (b) encerrar é definitivo.
