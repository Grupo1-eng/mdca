# Regras de Negócio — Gestão

Regras que o backend do módulo de gestão deve preservar. Cada regra vem do documento de requisitos (Sprint 0); aqui o foco é onde ela é aplicada no código.

Convenção: regras de negócio ficam no **service**, nunca no controller. O controller valida entrada e saída (DTO) e delega.

## Preservação de histórico

**RN01 — Inativar educando não remove registros vinculados.**
A inativação é `ativo = false` no `Educando`. Evoluções, encontros, frequências e compromissos continuam existindo e consultáveis. Não existe `DELETE` de educando na API.

**RN10 — Inativar usuário não remove autoria.**
O mesmo vale para `Usuario`: a referência em evoluções e demais registros históricos permanece. O usuário inativo não autentica, mas continua sendo o autor dos registros que criou.

**RN05 — Compromisso cancelado permanece no histórico.**
Cancelar é mudar `situacao` para `CANCELADO`, via endpoint próprio (`PATCH .../cancelar`), não `DELETE`. Compromissos cancelados não entram em nenhuma contagem de realizados.

## Cadastro

**RN02 — CPF e NIS só validam duplicidade quando informados.**
Ambos são opcionais. A ausência não impede o cadastro. Quando informados, o service consulta coincidências antes de gravar e devolve a sinalização; conforme RF03, a checagem sinaliza possíveis duplicados **antes da confirmação** — a decisão de bloquear ou apenas alertar está em `perguntas-em-aberto.md`.

## Registros técnicos

**RN03 — Toda evolução tem educando, profissional responsável e data/hora.**
Os três são obrigatórios na criação. O profissional vem do usuário autenticado, não do corpo da requisição — evita que um usuário registre evolução em nome de outro.

**RN04 — Acompanhamento de encaminhamento preserva o registro original.**
A atualização da efetivação escreve apenas nos campos de acompanhamento (situação, observação, data). O texto do encaminhamento original não é alterado por essa operação.

**RN09 — Registros técnicos sensíveis exigem perfil e responsabilidade.**
Nesta sprint, apenas a checagem de perfil está implementada. A parte de responsabilidade sobre o caso (RF12) é trabalho posterior — ver `escopo-sprint1.md`.

## Frequência

**RN06 — Um único registro de frequência vigente por educando e encontro.**
Garantido por constraint única em `(encontro, educando)` no banco, e por upsert no service: se já existe registro para o par, atualiza; não insere duplicado.

## Indicadores

**RN07 — Indicadores calculam apenas sobre os registros filtrados.**
Nenhum indicador é calculado sobre o total geral quando há filtro de período ou iniciativa aplicado.

**RN08 — Atendimentos e encontros são indicadores distintos.**
Atendimentos registrados (evoluções) e encontros realizados são contagens separadas. Não somar em um número único de "ações": são grandezas diferentes e a MDCA precisa reportá-las separadamente aos parceiros.

## Organização institucional

**RN11 — Iniciativas usam identificação institucional única.**
Educando, atividade e evolução referenciam `ProjetoServicoPrograma` pela mesma chave usada nos filtros e indicadores. Não duplicar nome de iniciativa como texto livre em nenhuma entidade.
