import { contextoAtual } from '../../../common/contexto/contexto-requisicao';
import { RegistroAuditoriaService } from './registro-auditoria.service';

jest.mock('../../../common/contexto/contexto-requisicao', () => ({
  contextoAtual: jest.fn(),
}));

describe('RegistroAuditoriaService', () => {
  const prisma = { auditoria: { create: jest.fn() } };
  const tx = { auditoria: { create: jest.fn() } };
  const service = new RegistroAuditoriaService(prisma as any);

  beforeEach(() => {
    jest.resetAllMocks();
    (contextoAtual as jest.Mock).mockReturnValue({
      requestId: 'req-1',
      ip: '10.0.0.1',
      userAgent: 'navegador',
      usuario: { id: 7, nome: 'Ana', email: 'ana@x.org', perfil: 'gestor_financeiro', organizacaoId: 3 },
    });
  });

  it('grava na transação recebida, com autor e origem vindos do contexto', async () => {
    await service.registrar(tx as any, {
      acao: 'atualizar',
      recursoTipo: 'lancamento',
      recursoId: 42,
      resumo: 'Lançamento #42 atualizado',
      alteracoes: { valor: { de: '100', para: '150' } },
    });

    expect(prisma.auditoria.create).not.toHaveBeenCalled();
    expect(tx.auditoria.create).toHaveBeenCalledWith({
      data: {
        modulo: 'financeiro',
        acao: 'atualizar',
        recursoTipo: 'lancamento',
        recursoId: '42',
        resumo: 'Lançamento #42 atualizado',
        alteracoes: { valor: { de: '100', para: '150' } },
        usuarioId: 7,
        perfil: 'gestor_financeiro',
        organizacaoId: 3,
        ip: '10.0.0.1',
        userAgent: 'navegador',
        requestId: 'req-1',
      },
    });
  });

  it('não grava nome nem e-mail do autor, só o id', async () => {
    await service.registrar(tx as any, { acao: 'criar', recursoTipo: 'contato', resumo: 'x' });

    const data = tx.auditoria.create.mock.calls[0][0].data;
    expect(JSON.stringify(data)).not.toContain('ana@x.org');
    expect(JSON.stringify(data)).not.toContain('Ana');
  });

  it('a falha ao gravar dentro da transação é propagada, para desfazer a operação', async () => {
    tx.auditoria.create.mockRejectedValue(new Error('banco fora'));

    await expect(
      service.registrar(tx as any, { acao: 'excluir', recursoTipo: 'orcamento', resumo: 'x' }),
    ).rejects.toThrow('banco fora');
  });

  it('alterações vazias não são gravadas', async () => {
    await service.registrar(tx as any, { acao: 'atualizar', recursoTipo: 'contato', resumo: 'x', alteracoes: {} });

    expect(tx.auditoria.create.mock.calls[0][0].data.alteracoes).toBeUndefined();
  });

  it('autor explícito tem prioridade sobre o contexto (login_falhou sem token)', async () => {
    (contextoAtual as jest.Mock).mockReturnValue({ requestId: 'r', ip: '1.1.1.1', userAgent: null, usuario: undefined });

    await service.registrarAvulso({
      modulo: 'auth',
      acao: 'login_falhou',
      recursoTipo: 'usuario',
      resumo: 'Senha incorreta',
      autor: { id: 5, perfil: 'analista_financeiro', organizacaoId: 3 },
    });

    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ modulo: 'auth', usuarioId: 5, organizacaoId: 3, ip: '1.1.1.1' }),
    });
  });

  it('registro avulso não lança erro quando o banco falha', async () => {
    prisma.auditoria.create.mockRejectedValue(new Error('banco fora'));
    jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);

    await expect(
      service.registrarAvulso({ acao: 'acesso_negado', recursoTipo: 'rota', resumo: 'x' }),
    ).resolves.toBeUndefined();
  });

  it('sem requisição e sem autor, grava sem usuário', async () => {
    (contextoAtual as jest.Mock).mockReturnValue(undefined);

    await service.registrar(tx as any, { acao: 'criar', recursoTipo: 'lancamento', resumo: 'x' });

    expect(tx.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: null, organizacaoId: null, ip: null, requestId: null }),
    });
  });
});
