# Perguntas em Aberto — Gestão

Decisões que ainda dependem de validação com os stakeholders do MDCA ou de acordo com o grupo financeiro.

## Com o grupo financeiro

**`ProjetoServicoPrograma` é de quem?**
A gestão precisa da entidade para RF20/RF21, e o financeiro provavelmente precisa dela para orçamento e prestação de contas por projeto. Se for compartilhada, sai de `modules/gestao/` e vira código comum, com revisão cruzada obrigatória. Precisa ser decidido antes da primeira migration, porque bloqueia a modelagem dos dois lados.

**Onde fica a auditoria (RF13)?**
A auditoria precisa cobrir gestão e financeiro igualmente. Proposta: implementação transversal em `backend/src/common/`, aplicada por interceptor, em vez de cada módulo registrar o próprio log. Depende de acordo entre os grupos.

**Campos mínimos de `Usuario`.**
Os perfis da gestão (coordenação, técnicos, educador, administrativo) não são necessariamente os mesmos de que o financeiro precisa. Definir se o campo `perfil` comporta os dois conjuntos ou se haverá separação por módulo.

## Com a MDCA

**Duplicidade bloqueia ou apenas alerta?**
RF03 diz "sinalizar coincidências antes da confirmação". Não está definido se, confirmada a coincidência, o usuário pode prosseguir com o cadastro mesmo assim (por exemplo, dois educandos com CPF digitado errado) ou se o sistema impede. Enquanto não houver definição, o backend sinaliza e impede.

**Um encaminhamento pode ter mais de um acompanhamento?**
O modelo atual guarda uma única efetivação por encaminhamento. Se a MDCA acompanha o mesmo encaminhamento em várias etapas (por exemplo, encaminhado, agendado, atendido), é preciso uma tabela separada de acompanhamentos.

**Quais perfis existem de fato?**
Os cinco perfis documentados foram inferidos da estrutura de equipe descrita na elicitação, não confirmados nominalmente pela MDCA. Confirmar antes de fixar no banco.

**Educador pode ver o cadastro completo do educando?**
Está definido que o educador não acessa fichas técnicas sigilosas, mas não está claro se ele vê dados socioeconômicos ou apenas o suficiente para registrar frequência.

**O que exatamente precisa sair no CSV e no PDF?**
RF15 prevê exportação, mas cada parceiro (SMAS, FUNCRIANÇA, CMDCA, CEBAS) tem formulário próprio. Um exemplo de relatório real já entregue a um parceiro ajudaria a definir as colunas da exportação.

## Escopo

**RNF04 — resiliência de conexão.**
A MDCA relatou oscilação de internet na sede. A solução completa (cache local com sincronização) tem custo alto. Proposta: preservar o formulário preenchido no navegador até a confirmação do salvamento, sem sincronização offline. Confirmar se atende.

**Cadastro de funcionários e voluntários.**
Levantado a partir das fichas de admissão fornecidas pela MDCA, mas a própria organização priorizou o setor administrativo para uma etapa posterior. Fica fora desta sprint; o levantamento de campos está no documento de requisitos (Anexo B).
