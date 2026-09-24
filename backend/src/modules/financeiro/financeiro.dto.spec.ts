import { validarDto } from '../../../test/validar-dto';
import { CreateAuditoriaDto } from '../shared/auditorias/dto/create-auditoria.dto';
import { CreateProjetoDto } from '../shared/projetos/dto/create-projeto.dto';
import { CreateContaFinanceiraDto } from './contas-financeiras/dto/create-conta-financeira.dto';
import { UpdateContaFinanceiraDto } from './contas-financeiras/dto/update-conta-financeira.dto';
import { CreateLancamentoDto } from './lancamentos/dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './lancamentos/dto/update-lancamento.dto';
import { CreateOrcamentoDto } from './orcamentos/dto/create-orcamento.dto';

const lancamento = {
  contaId: 1,
  categoriaId: 2,
  valor: '150.75',
  tipo: 'saida',
};

describe('valores em dinheiro', () => {
  it('mantém o valor como texto decimal exato, sem passar por float', async () => {
    const { valor } = await validarDto(CreateLancamentoDto, lancamento);
    expect(valor?.valor).toBe('150.75');
  });

  it('aceita número vindo do JSON e converte para texto decimal', async () => {
    const { valor } = await validarDto(CreateLancamentoDto, { ...lancamento, valor: 19.1 });
    expect(valor?.valor).toBe('19.1');
  });

  it('recusa um número que já chegou com erro de arredondamento', async () => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, valor: 0.1 + 0.2 });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('valor')]));
  });

  it('recusa mais de 2 casas decimais', async () => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, valor: '10.001' });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('valor')]));
  });

  it('recusa texto que não é número', async () => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, valor: '10,50' });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('valor')]));
  });

  it('recusa valor de lançamento negativo (a direção vem do tipo)', async () => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, valor: '-10.00' });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('valor')]));
  });

  it('aceita saldo de conta negativo', async () => {
    const { valor, erros } = await validarDto(CreateContaFinanceiraDto, {
      nome: 'Conta corrente',
      saldoInicial: '-50.00',
    });
    expect(erros).toBeUndefined();
    expect(valor?.saldoInicial).toBe('-50.00');
  });

  it('aplica a mesma regra ao valor previsto do orçamento', async () => {
    const { valor } = await validarDto(CreateOrcamentoDto, {
      projetoId: 1,
      categoriaId: 2,
      periodoReferencia: '2026-09',
      valorPrevisto: 1000.5,
    });
    expect(valor?.valorPrevisto).toBe('1000.5');
  });

  it('aplica a mesma regra ao orçamento total do projeto', async () => {
    const { erros } = await validarDto(CreateProjetoDto, {
      nome: 'Projeto',
      status: 'ativo',
      orcamentoTotal: '1.999',
    });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('orcamentoTotal')]));
  });
});

describe('tipo e situação do lançamento', () => {
  it.each(['entrada', 'saida'])('aceita tipo %s', async (tipo) => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, tipo });
    expect(erros).toBeUndefined();
  });

  it.each(['Entrada', 'receita', ''])('recusa tipo "%s"', async (tipo) => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, tipo });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('tipo')]));
  });

  it.each(['pendente', 'pago', 'recebido'])('aceita situação %s', async (situacao) => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, situacao });
    expect(erros).toBeUndefined();
  });

  it.each(['Pago', 'Previsto', 'cancelado'])('recusa situação "%s"', async (situacao) => {
    const { erros } = await validarDto(CreateLancamentoDto, { ...lancamento, situacao });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('situacao')]));
  });

  it('valida também na atualização', async () => {
    const { erros } = await validarDto(UpdateLancamentoDto, { situacao: 'Pago' });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('situacao')]));
  });
});

describe('campos definidos pelo servidor', () => {
  it('lançamento: descarta usuarioId e criadoEm enviados pelo cliente', async () => {
    const { valor } = await validarDto(CreateLancamentoDto, {
      ...lancamento,
      usuarioId: 1,
      criadoEm: '2020-01-01T00:00:00Z',
    });
    expect(valor).not.toHaveProperty('usuarioId');
    expect(valor).not.toHaveProperty('criadoEm');
  });

  it('conta: descarta organizacaoId, inclusive na atualização', async () => {
    const criada = await validarDto(CreateContaFinanceiraDto, { nome: 'Caixa', organizacaoId: 2 });
    const atualizada = await validarDto(UpdateContaFinanceiraDto, { organizacaoId: 2 });
    expect(criada.valor).not.toHaveProperty('organizacaoId');
    expect(atualizada.valor).not.toHaveProperty('organizacaoId');
  });

  it('projeto: descarta organizacaoId', async () => {
    const { valor } = await validarDto(CreateProjetoDto, {
      nome: 'Projeto',
      status: 'ativo',
      organizacaoId: 2,
    });
    expect(valor).not.toHaveProperty('organizacaoId');
  });

  it('auditoria: descarta usuarioId e dataHora', async () => {
    const { valor } = await validarDto(CreateAuditoriaDto, {
      recursoId: '1',
      recursoTipo: 'lancamento',
      acao: 'criar',
      usuarioId: 1,
      dataHora: '2020-01-01T00:00:00Z',
    });
    expect(valor).not.toHaveProperty('usuarioId');
    expect(valor).not.toHaveProperty('dataHora');
  });
});
