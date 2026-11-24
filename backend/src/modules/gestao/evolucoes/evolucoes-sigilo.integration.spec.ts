import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

// Evolução sigilosa pelas rotas (MDCA, perguntas 24 e 25): o técnico de outro
// serviço recebe a evolução sem o texto e não pode alterá-la; o mesmo serviço
// e a coordenação recebem tudo. O filtro é no backend, não na tela.
describe('Evoluções sigilosas (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    educando: { findFirst: jest.fn() },
    projeto: { findFirst: jest.fn() },
    evolucao: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    encaminhamento: { findMany: jest.fn(), findFirst: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  // Registrada pelo usuário 10, técnico de Serviço Social.
  const sigilosaDoSS = {
    id: 27,
    educandoId: 15,
    projetoId: null,
    profissionalId: 10,
    profissional: { id: 10, nome: 'Bia', perfil: 'tecnico_servico_social' },
    titulo: null,
    tipo: 'atendimento',
    descricao: 'Relato sigiloso',
    intervencaoUsuario: 'Com o usuário',
    intervencaoFamilia: 'Com a família',
    dataInicio: '2026-11-20T13:00:00.000Z',
    dataFim: null,
    situacao: 'aberta',
    sigiloso: true,
    encaminhamentos: [],
  };

  const comum = {
    ...sigilosaDoSS,
    id: 28,
    sigiloso: false,
    descricao: 'Relato comum',
  };

  function logadoComo(perfil: string, id = 7) {
    prisma.usuario.findUnique.mockResolvedValue({
      id,
      organizacaoId: 3,
      nome: 'Usuário',
      email: 'usuario@mdca.org.br',
      perfil,
      ativo: true,
    });
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
    prisma.educando.findFirst.mockResolvedValue({ id: 15 });
  });

  function chamar(metodo: 'get' | 'put', rota: string) {
    return request(app.getHttpServer())
      [metodo](rota)
      .set('Authorization', `Bearer ${token}`);
  }

  it('GET por educando: Psicologia recebe a sigilosa do SS sem o texto', async () => {
    logadoComo('tecnico_psicologia');
    prisma.evolucao.findMany.mockResolvedValue([sigilosaDoSS, comum]);

    const res = await chamar('get', '/api/evolucoes?educandoId=15');

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      id: 27,
      sigiloso: true,
      descricao: null,
      intervencaoUsuario: null,
      intervencaoFamilia: null,
      conteudoOculto: true,
      profissional: { nome: 'Bia' },
    });
    expect(res.body[1]).toMatchObject({
      id: 28,
      descricao: 'Relato comum',
      conteudoOculto: false,
    });
    // A consulta traz o perfil de quem registrou, base da regra.
    expect(
      prisma.evolucao.findMany.mock.calls[0][0].include.profissional.select,
    ).toMatchObject({ perfil: true });
  });

  it('GET por educando: outro técnico do SS recebe tudo', async () => {
    logadoComo('tecnico_servico_social');
    prisma.evolucao.findMany.mockResolvedValue([sigilosaDoSS]);

    const res = await chamar('get', '/api/evolucoes?educandoId=15');

    expect(res.body[0]).toMatchObject({
      descricao: 'Relato sigiloso',
      intervencaoFamilia: 'Com a família',
      conteudoOculto: false,
    });
  });

  it('GET por educando: a coordenação recebe tudo', async () => {
    logadoComo('coordenador');
    prisma.evolucao.findMany.mockResolvedValue([sigilosaDoSS]);

    const res = await chamar('get', '/api/evolucoes?educandoId=15');

    expect(res.body[0]).toMatchObject({
      descricao: 'Relato sigiloso',
      conteudoOculto: false,
    });
  });

  it('GET :id aplica a mesma regra', async () => {
    logadoComo('tecnico_psicologia');
    prisma.evolucao.findFirst.mockResolvedValue(sigilosaDoSS);

    const res = await chamar('get', '/api/evolucoes/27');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ descricao: null, conteudoOculto: true });
  });

  it('PUT: Psicologia não altera a sigilosa do SS (403) e nada é gravado', async () => {
    logadoComo('tecnico_psicologia');
    prisma.evolucao.findFirst.mockResolvedValue(sigilosaDoSS);

    const res = await chamar('put', '/api/evolucoes/27').send({ sigiloso: false });

    expect(res.status).toBe(403);
    expect(prisma.evolucao.update).not.toHaveBeenCalled();
  });

  it('PUT: o mesmo serviço altera', async () => {
    logadoComo('tecnico_servico_social');
    prisma.evolucao.findFirst.mockResolvedValue(sigilosaDoSS);
    prisma.evolucao.update.mockResolvedValue({ ...sigilosaDoSS, descricao: 'Novo' });

    const res = await chamar('put', '/api/evolucoes/27').send({ descricao: 'Novo' });

    expect(res.status).toBe(200);
    expect(prisma.evolucao.update).toHaveBeenCalled();
  });

  it('PUT: evolução comum continua aberta a outro serviço', async () => {
    logadoComo('tecnico_psicologia');
    prisma.evolucao.findFirst.mockResolvedValue(comum);
    prisma.evolucao.update.mockResolvedValue(comum);

    const res = await chamar('put', '/api/evolucoes/28').send({ descricao: 'Ajuste' });

    expect(res.status).toBe(200);
  });

  it('GET de encaminhamentos: sem descrição se ligado a sigilosa de outro serviço', async () => {
    logadoComo('tecnico_psicologia');
    prisma.encaminhamento.findMany.mockResolvedValue([
      {
        id: 8,
        educandoId: 15,
        evolucaoId: 27,
        descricao: 'Motivo sigiloso',
        destino: 'CAPS',
        acompanhamentos: [{ id: 1, situacao: 'pendente', observacao: 'Obs.' }],
        evolucao: {
          sigiloso: true,
          profissionalId: 10,
          profissional: { perfil: 'tecnico_servico_social' },
        },
      },
      {
        id: 9,
        educandoId: 15,
        evolucaoId: null,
        descricao: 'Motivo comum',
        acompanhamentos: [],
        evolucao: null,
      },
    ]);

    const res = await chamar('get', '/api/encaminhamentos?educandoId=15');

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      id: 8,
      destino: 'CAPS',
      descricao: null,
      conteudoOculto: true,
      acompanhamentos: [{ observacao: null }],
    });
    expect(res.body[0]).not.toHaveProperty('evolucao');
    expect(res.body[1]).toMatchObject({ descricao: 'Motivo comum', conteudoOculto: false });
  });
});
