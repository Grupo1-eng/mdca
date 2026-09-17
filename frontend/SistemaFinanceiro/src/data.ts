export const lancamentos = [
  { data: "22/08/2026", descricao: "Convênio SEDES — Parcela 3", projeto: "Projeto Semear", conta: "C/C Bradesco", valor: 18500, tipo: "entrada", situacao: "Recebido" },
  { data: "21/08/2026", descricao: "Pagamento folha de pessoal", projeto: "Administrativo", conta: "C/C Bradesco", valor: -12400, tipo: "saida", situacao: "Pago" },
  { data: "20/08/2026", descricao: "Doação — Instituto Cidadania", projeto: "Projeto Raízes", conta: "C/C Itaú", valor: 5000, tipo: "entrada", situacao: "Recebido" },
  { data: "19/08/2026", descricao: "Aluguel sede", projeto: "Administrativo", conta: "C/C Bradesco", valor: -3200, tipo: "saida", situacao: "Pago" },
  { data: "18/08/2026", descricao: "Reembolso material didático", projeto: "Projeto Semear", conta: "C/C Itaú", valor: -870, tipo: "saida", situacao: "Pago" },
  { data: "15/08/2026", descricao: "Captação — Edital Cultura Viva", projeto: "Projeto Voz Ativa", conta: "C/C Bradesco", valor: 9600, tipo: "entrada", situacao: "Previsto" },
  { data: "14/08/2026", descricao: "Internet e telefonia", projeto: "Administrativo", conta: "C/C Itaú", valor: -480, tipo: "saida", situacao: "Pago" },
  { data: "10/08/2026", descricao: "Bolsa — Monitor educacional", projeto: "Projeto Semear", conta: "C/C Bradesco", valor: -1800, tipo: "saida", situacao: "Pago" },
];

export const projetos = [
  { nome: "Projeto Semear", descricao: "Educação rural e capacitação agrícola sustentável", status: "Em andamento", inicio: "01/03/2026", inicioAno: 2026, inicioMes: 3, fim: "28/02/2027", fimAno: 2027, fimMes: 2, duracao: "12 meses", cor: "#0e7e6e", orcamento: 148000, realizado: 74200, tags: ["Educação", "Rural", "Conv. SEDES"] },
  { nome: "Projeto Raízes", descricao: "Fortalecimento de identidades culturais comunitárias", status: "Em andamento", inicio: "01/06/2026", inicioAno: 2026, inicioMes: 6, fim: "31/05/2027", fimAno: 2027, fimMes: 5, duracao: "12 meses", cor: "#1a3a6b", orcamento: 92000, realizado: 23500, tags: ["Cultura", "Comunidade"] },
  { nome: "Projeto Voz Ativa", descricao: "Comunicação e cidadania para jovens periféricos", status: "Planejamento", inicio: "01/10/2026", inicioAno: 2026, inicioMes: 10, fim: "30/09/2027", fimAno: 2027, fimMes: 9, duracao: "12 meses", cor: "#7c5fbd", orcamento: 76000, realizado: 0, tags: ["Juventude", "Comunicação", "Edital"] },
  { nome: "Rede Solidária", descricao: "Articulação de redes de economia solidária", status: "Concluído", inicio: "01/01/2025", inicioAno: 2025, inicioMes: 1, fim: "31/12/2025", fimAno: 2025, fimMes: 12, duracao: "12 meses", cor: "#6b7a99", orcamento: 110000, realizado: 108750, tags: ["Economia Solidária", "Articulação"] },
];

export const contatosData = [
  { nome: "Instituto Cidadania", tipo: "Financiador", cnpj: "12.345.678/0001-90", email: "contato@institutocidadania.org.br", telefone: "(61) 3333-1234", status: "Ativo" },
  { nome: "Secretaria de Educação — DF", tipo: "Gov. Distrital", cnpj: "00.394.502/0001-44", email: "convenios@se.df.gov.br", telefone: "(61) 3901-5555", status: "Ativo" },
  { nome: "Fundação Banco do Brasil", tipo: "Financiador", cnpj: "28.541.667/0001-53", email: "projetos@fbb.org.br", telefone: "(61) 3108-2100", status: "Ativo" },
  { nome: "Gráfica Novo Horizonte", tipo: "Fornecedor", cnpj: "45.678.912/0001-23", email: "comercial@graficanovohorizonte.com.br", telefone: "(61) 3222-8899", status: "Ativo" },
  { nome: "Maria José Santos", tipo: "Beneficiária", cnpj: "—", email: "mariajose@gmail.com", telefone: "(61) 98765-4321", status: "Ativo" },
  { nome: "Consultoria AdmONG", tipo: "Fornecedor", cnpj: "67.890.123/0001-45", email: "financeiro@admong.com.br", telefone: "(61) 3111-2233", status: "Inativo" },
];

export const contasData = [
  { nome: "C/C Bradesco", banco: "Bradesco", agencia: "1234-5", conta: "12345-6", tipo: "Conta Corrente", saldo: 121440, status: "Ativa" },
  { nome: "C/C Itaú", banco: "Itaú", agencia: "0567-8", conta: "98765-4", tipo: "Conta Corrente", saldo: 62880, status: "Ativa" },
  { nome: "Caixa Pequenas Despesas", banco: "—", agencia: "—", conta: "—", tipo: "Caixa Interno", saldo: 1200, status: "Ativa" },
];

export const fontesData = [
  { nome: "Convênio SEDES", origem: "Gov. Estadual", tipo: "Convênio", vigencia: "Mar 2026 – Fev 2027", valor: 148000, status: "Vigente" },
  { nome: "Instituto Cidadania", origem: "Privado", tipo: "Doação", vigencia: "Jun 2026 – Mai 2027", valor: 92000, status: "Vigente" },
  { nome: "Edital Cultura Viva", origem: "Gov. Federal", tipo: "Edital", vigencia: "Out 2026 – Set 2027", valor: 76000, status: "Aguardando" },
  { nome: "Recursos Próprios", origem: "Interno", tipo: "Recurso Próprio", vigencia: "Contínuo", valor: 0, status: "Vigente" },
];

export const categoriasData = [
  { codigo: "1.0", nome: "Receitas", tipo: "Receita", subcategorias: ["1.1 Convênios e contratos", "1.2 Doações institucionais", "1.3 Doações pessoas físicas", "1.4 Rendimentos financeiros"] },
  { codigo: "2.0", nome: "Pessoal e Encargos", tipo: "Despesa", subcategorias: ["2.1 Salários", "2.2 Encargos sociais", "2.3 Bolsas educacionais"] },
  { codigo: "3.0", nome: "Custeio Operacional", tipo: "Despesa", subcategorias: ["3.1 Aluguel", "3.2 Energia e água", "3.3 Internet e telefonia", "3.4 Material de escritório"] },
  { codigo: "4.0", nome: "Projetos e Programas", tipo: "Despesa", subcategorias: ["4.1 Material didático", "4.2 Transporte", "4.3 Produção de eventos", "4.4 Contratação de serviços"] },
];
