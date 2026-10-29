import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { LIMITE_EXPORTACAO } from './auditorias.service';

// Log de auditoria: só coordenador e gestor financeiro leem, sempre limitado
// à organização do token; o cliente nunca grava.
describe('Rotas de auditoria (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    auditoria: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  function logado(perfil: string) {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Maria',
      email: 'maria@mdca.org.br',
      perfil,
      ativo: true,
    });
  }

  function get(rota: string) {
    return request(app.getHttpServer()).get(rota).set('Authorization', `Bearer ${token}`);
  }

  function registro(id: number) {
    return {
      id,
      organizacaoId: 3,
      usuarioId: 7,
      perfil: 'gestor_financeiro',
      modulo: 'financeiro',
      acao: 'atualizar',
      recursoTipo: 'lancamento',
      recursoId: '42',
      resumo: 'Lançamento #42 atualizado',
      alteracoes: { valor: { de: '100', para: '150' } },
      ip: '10.0.0.1',
      userAgent: 'navegador',
      requestId: 'req-1',
      dataHora: new Date('2026-10-29T15:00:00Z'),
      usuario: { id: 7, nome: 'Maria' },
    };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    token = app.get(JwtService).sign({ sub: 7 });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    logado('gestor_financeiro');
  });

  it.each(['analista_financeiro', 'administrativo', 'coordenador', 'educador'])(
    '%s recebe 403 em todas as rotas',
    async (perfil) => {
      logado(perfil);
      for (const rota of ['/api/auditorias', '/api/auditorias/exportar', '/api/auditorias/lancamento/42', '/api/auditorias/1']) {
        const res = await get(rota);
        expect(res.status).toBe(403);
      }
      expect(prisma.auditoria.findMany).not.toHaveBeenCalled();
    },
  );

  it.each(['coordenador_financeiro', 'gestor_financeiro'])('%s consulta o log', async (perfil) => {
    logado(perfil);
    prisma.auditoria.findMany.mockResolvedValue([]);

    const res = await get('/api/auditorias');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ itens: [], proximoCursor: null });
  });

  it('a listagem fica restrita à organização do token e ao módulo financeiro', async () => {
    prisma.auditoria.findMany.mockResolvedValue([]);

    await get('/api/auditorias?acao=excluir&usuarioId=9&organizacaoId=1');

    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizacaoId: 3, modulo: 'financeiro', acao: 'excluir', usuarioId: 9 }),
        orderBy: { id: 'desc' },
        take: 51,
      }),
    );
  });

  it('pagina por cursor: devolve o id do último item quando há mais registros', async () => {
    prisma.auditoria.findMany.mockResolvedValue([registro(30), registro(29), registro(28)]);

    const res = await get('/api/auditorias?limite=2&cursor=31');

    expect(res.body.itens).toHaveLength(2);
    expect(res.body.proximoCursor).toBe(29);
    expect(prisma.auditoria.findMany.mock.calls[0][0].where.AND[1]).toEqual({ id: { lt: 31 } });
  });

  it('filtro por data sem horário usa o dia inteiro no horário de Brasília', async () => {
    prisma.auditoria.findMany.mockResolvedValue([]);

    await get('/api/auditorias?de=2026-10-01&ate=2026-10-31');

    expect(prisma.auditoria.findMany.mock.calls[0][0].where.dataHora).toEqual({
      gte: new Date('2026-10-01T03:00:00Z'),
      lt: new Date('2026-11-01T03:00:00Z'),
    });
  });

  it('recusa limite acima de 100 e data inválida', async () => {
    expect((await get('/api/auditorias?limite=500')).status).toBe(400);
    expect((await get('/api/auditorias?de=2026-13-45')).status).toBe(400);
  });

  it('histórico de um registro filtra por tipo, id e organização', async () => {
    prisma.auditoria.findMany.mockResolvedValue([registro(1)]);

    const res = await get('/api/auditorias/lancamento/42');

    expect(res.status).toBe(200);
    expect(prisma.auditoria.findMany.mock.calls[0][0].where).toEqual({
      organizacaoId: 3,
      modulo: 'financeiro',
      recursoTipo: 'lancamento',
      recursoId: '42',
    });
  });

  it('registro de outra organização responde 404', async () => {
    prisma.auditoria.findFirst.mockResolvedValue(null);

    const res = await get('/api/auditorias/5');

    expect(res.status).toBe(404);
    expect(prisma.auditoria.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5, organizacaoId: 3, modulo: 'financeiro' } }),
    );
  });

  it('exporta CSV e registra a própria exportação na auditoria', async () => {
    prisma.auditoria.count.mockResolvedValue(1);
    prisma.auditoria.findMany.mockResolvedValue([{ ...registro(1), resumo: '=HIPERLINK("x")' }]);

    const res = await get('/api/auditorias/exportar?de=2026-10-01');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    const [cabecalho, linha] = res.text.replace('﻿', '').split('\r\n');
    expect(cabecalho).toBe(
      'data_hora;usuario_id;usuario_nome;perfil;acao;recurso_tipo;recurso_id;resumo;alteracoes;ip;request_id',
    );
    expect(linha).toContain('29/10/2026, 12:00:00');
    expect(linha).toContain(`"'=HIPERLINK(""x"")"`);
    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ acao: 'exportar', recursoTipo: 'auditoria', usuarioId: 7, organizacaoId: 3 }),
    });
  });

  it('recusa exportação acima do limite', async () => {
    prisma.auditoria.count.mockResolvedValue(LIMITE_EXPORTACAO + 1);

    const res = await get('/api/auditorias/exportar');

    expect(res.status).toBe(400);
    expect(prisma.auditoria.findMany).not.toHaveBeenCalled();
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)('%s não existe', async (metodo) => {
    const res = await request(app.getHttpServer())[metodo]('/api/auditorias/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
