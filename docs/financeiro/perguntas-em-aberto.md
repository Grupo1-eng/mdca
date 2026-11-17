# Perguntas em Aberto — Financeiro

Decisões que ainda dependem de validação com os stakeholders do MDCA.

## Origem das entradas e saídas no relatório de execução orçamentária (US-16)

**Situação atual:** o relatório trata "origem" como o **contato** do lançamento (`contatoId`). Lançamento sem contato aparece como "Sem origem informada". Não há vínculo entre lançamento e `FonteDeRecurso`.

**Pergunta:** a origem esperada é o contato (financiador, fornecedor) ou a fonte de recurso? Se for a fonte de recurso, é preciso criar `fonteId` em `Lancamento` (migration, formulário e validações) em outra US.

## Saldo do projeto no relatório de execução orçamentária (US-16)

**Situação atual:** o saldo do projeto é **entradas recebidas − saídas pagas** dos lançamentos do projeto. A conta financeira não pertence a projeto, então não existe saldo bancário por projeto.

**Pergunta:** essa definição atende o gestor financeiro, ou ele espera o saldo da conta bancária vinculada ao projeto?

## Período do relatório x orçado (US-16)

**Situação atual:** entradas, saídas e realizado seguem o filtro de período (padrão "Este mês"). O orçado soma todos os orçamentos cadastrados do projeto, sem recorte, porque `periodoReferencia` é texto livre.

**Pergunta:** o relatório deve abrir em "Todo o período", ou o orçado deve ser recortado pelo período de referência do orçamento?