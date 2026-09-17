# Modelo de Dados — Gestão

Entidades do módulo de gestão, para entrar no `backend/prisma/schema.prisma` (arquivo compartilhado: alterações exigem revisão de alguém do financeiro, conforme `docs/decisoes.md`).

## Entidades compartilhadas

Duas entidades não pertencem à gestão, mas são usadas por ela e precisam ser acordadas com o financeiro antes de qualquer modelagem:

- **`Usuario`** — autenticação e autoria de registros. Campos mínimos: nome, e-mail, senha (hash), perfil, ativo.
- **`ProjetoServicoPrograma`** — a iniciativa institucional (RF20/RF21). Campos mínimos: nome, tipo (`PROJETO`, `SERVICO`, `PROGRAMA`), período de vigência, situação. O financeiro provavelmente também referencia esta entidade para orçamento por projeto, por isso ela é compartilhada e não pertence a nenhum dos dois módulos.

## Entidades da gestão

### Educando e dados relacionados (RF01–RF05)

- **`Educando`** — dados pessoais (nome, NIS, CPF, RG, cor autodeclarada, data de nascimento, endereço, telefone), dados escolares (escola, ano/série, turno, repetência), vínculo com `ProjetoServicoPrograma` e `OrigemEncaminhamento`, e o campo `ativo` para a inativação prevista em RN01.
- **`OrigemEncaminhamento`** — tabela de apoio. Valores iniciais no Anexo A.2 do documento de requisitos. É tabela e não enum porque a coordenação precisa poder incluir novas origens sem alteração de código.
- **`MotivoIngresso`** e **`EducandoMotivoIngresso`** — relação N:N, já que o motivo de ingresso é seleção múltipla (RF02).
- **`ResponsavelFamiliar`** e **`EducandoResponsavel`** — relação N:N com atributo `vinculo` na associativa. É N:N porque um mesmo responsável pode ter mais de um educando atendido (irmãos) e um educando pode ter mais de um responsável.
- **`EducandoSaude`** e **`SituacaoSocioeconomica`** — relação 1:1 com `Educando`, em tabelas próprias. A separação é deliberada: isola os dados sensíveis (RF12/RNF05) para que a restrição de acesso possa ser aplicada na consulta, sem depender de filtrar campo a campo dentro do educando.

### Evolução (RF06–RF08)

- **`Evolucao`** — vínculo obrigatório com `Educando`, com o `Usuario` responsável e com data/hora (RN03). Guarda o registro do atendimento e, quando houver, o encaminhamento.
- O acompanhamento posterior do encaminhamento (RF08/RN04) fica em campos próprios do mesmo registro (situação da efetivação, observação e data), preservando o texto original do encaminhamento. Alternativa a avaliar: tabela separada de acompanhamentos, caso a MDCA precise de mais de um acompanhamento por encaminhamento — ver `perguntas-em-aberto.md`.

### Agenda (RF09, RF10)

- **`Compromisso`** — título, tipo (`REUNIAO`, `ATENDIMENTO`, `ATIVIDADE`), data/hora, `Usuario` responsável, `Educando` opcional e `situacao` (`AGENDADO`, `REALIZADO`, `CANCELADO`). O cancelamento é mudança de situação, nunca exclusão (RN05).

### Atividades, encontros e frequência (RF17–RF19)

- **`Atividade`** — nome, descrição, vínculo obrigatório com `ProjetoServicoPrograma` e com um `Usuario` responsável, e situação.
- **`Encontro`** — a ocorrência datada de uma atividade: data, horário, local, situação e observações.
- **`EncontroParticipante`** — a frequência propriamente dita: encontro, educando, presença (booleano) e observação. Precisa de **constraint única em (encontro, educando)** para garantir o registro único vigente exigido por RN06; o registro de frequência é um upsert, não um insert.

## Convenções

- Chaves primárias em UUID.
- Nenhuma entidade de gestão usa exclusão física. Inativação (`ativo`) ou situação (`CANCELADO`) preservam o histórico, conforme RN01, RN05 e RN10.
- Todo registro com autoria referencia `Usuario` e mantém a referência mesmo após o usuário ser inativado (RN10).
