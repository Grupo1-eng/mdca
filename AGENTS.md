# AGENTS

Ponto de entrada para agentes de código trabalhando neste repositório. Descreve o mapa do repositório, a ordem de leitura, as responsabilidades de cada domínio (financeiro/gestão), as regras do banco compartilhado e os limites do que ainda não foi decidido.

## Fluxo de Git

Trabalhar sempre em branch própria, nunca direto no `main`: `feature/<grupo>-<descricao-curta>`, com `<grupo>` sendo `financeiro` ou `gestao` (ex.: `feature/financeiro-modelo-dados`). Integrar ao `main` via Pull Request. Ver a decisão completa e as regras de revisão cruzada em [`docs/decisoes.md`](docs/decisoes.md).

## Registro de evolução

Ao concluir uma correção ou evolução relevante, adicione uma entrada no topo de [`docs/registro-de-evolucao.md`](docs/registro-de-evolucao.md), seguindo o formato descrito no próprio arquivo. Se a mudança criar uma regra que vale daqui em diante, registre-a também em [`docs/decisoes.md`](docs/decisoes.md).
