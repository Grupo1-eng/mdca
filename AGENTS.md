# AGENTS

Ponto de entrada para agentes de código trabalhando neste repositório. Descreve o mapa do repositório, a ordem de leitura, as responsabilidades de cada domínio (financeiro/gestão), as regras do banco compartilhado e os limites do que ainda não foi decidido.

## Fluxo de Git

Trabalhar sempre em branch própria, nunca direto no `main`: `feature/<grupo>-<descricao-curta>`, com `<grupo>` sendo `financeiro` ou `gestao` (ex.: `feature/financeiro-modelo-dados`). Integrar ao `main` via Pull Request. Ver a decisão completa e as regras de revisão cruzada em [`docs/decisoes.md`](docs/decisoes.md).
