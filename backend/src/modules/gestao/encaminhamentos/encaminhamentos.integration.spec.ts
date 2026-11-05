import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { validarDto } from '../../../../test/validar-dto';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';

// US02: o encaminhamento registra o conteúdo/descrição do que foi realizado.
// O registro original é preservado: não há rota de alteração nem de exclusão.
// Os dados são isolados pela organização do usuário autenticado: educando,
// evolução e encaminhamento são buscados com o filtro de organização.
describe('Encaminhamentos (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    educando: { findFirst: jest.fn() },
    evolucao: { findFirst: jest.fn() },
    encaminhamento: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const encaminhamento = {
    id: 8,
    educandoId: 15,
    evolucaoId: 27,
    descricao: 'Encaminhado para atendimento especializado.',
    dataEncaminhamento: '2026-09-22T15:00:00.000Z',
    situacaoAtual: 'pendente',
    acompanhamentos: [],
  };

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
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Ana',
      email: 'ana@mdca.org.br',
      perfil: 'tecnico_servico_social',
      ativo: true,
    });
    // Educando 15 e evolução 27 pertencem à organização 3 do usuário.
    prisma.educando.findFirst.mockResolvedValue({ id: 15 });
    prisma.evolucao.findFirst.mockResolvedValue({ id: 27 });
  });

  function chamar(metodo: 'get' | 'post' | 'put' | 'delete', rota: string) {
    return request(app.getHttpServer())
      [metodo](rota)
      .set('Authorization', `Bearer ${token}`);
  }

  it('POST grava a descrição e a devolve na resposta', async () => {
    prisma.encaminhamento.create.mockResolvedValue(encaminhamento);

    const res = await chamar('post', '/api/encaminhamentos').send({
      educandoId: 15,
      evolucaoId: 27,
      descricao: 'Encaminhado para atendimento especializado.',
      dataEncaminhamento: '2026-09-22T15:00:00.000Z',
      situacaoAtual: 'pendente',
    });

    expect(res.status).toBe(201);
    expect(prisma.encaminhamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          educandoId: 15,
          descricao: 'Encaminhado para atendimento especializado.',
          // RN03: o profissional vem do token (usuário 7), não do corpo.
          profissionalId: 7,
        }),
      }),
    );
    expect(res.body.descricao).toBe('Encaminhado para atendimento especializado.');
  });

  it('POST sem descrição continua aceito', async () => {
    prisma.encaminhamento.create.mockResolvedValue({ ...encaminhamento, descricao: null });

    const res = await chamar('post', '/api/encaminhamentos').send({ educandoId: 15 });

    expect(res.status).toBe(201);
    expect(prisma.encaminhamento.create.mock.calls[0][0].data).not.toHaveProperty('descricao');
  });

  it('POST grava o destino e ignora profissionalId enviado no corpo', async () => {
    prisma.encaminhamento.create.mockResolvedValue({ ...encaminhamento, destino: 'CAPS Infantil' });

    const res = await chamar('post', '/api/encaminhamentos').send({
      educandoId: 15,
      destino: 'CAPS Infantil',
      profissionalId: 999,
    });

    expect(res.status).toBe(201);
    expect(prisma.encaminhamento.create.mock.calls[0][0].data).toMatchObject({
      destino: 'CAPS Infantil',
      profissionalId: 7,
    });
  });

  it('POST recusa descrição acima do tamanho máximo', async () => {
    const res = await chamar('post', '/api/encaminhamentos').send({
      educandoId: 15,
      descricao: 'a'.repeat(2001),
    });

    expect(res.status).toBe(400);
    expect(prisma.encaminhamento.create).not.toHaveBeenCalled();
  });

  it('GET por educando devolve a descrição', async () => {
    prisma.encaminhamento.findMany.mockResolvedValue([encaminhamento]);

    const res = await chamar('get', '/api/encaminhamentos?educandoId=15');

    expect(res.status).toBe(200);
    expect(prisma.encaminhamento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { educandoId: 15, educando: { is: { organizacaoId: 3 } } },
      }),
    );
    expect(res.body[0].descricao).toBe('Encaminhado para atendimento especializado.');
  });

  it('GET por id devolve a descrição', async () => {
    prisma.encaminhamento.findFirst.mockResolvedValue(encaminhamento);

    const res = await chamar('get', '/api/encaminhamentos/8');

    expect(res.status).toBe(200);
    expect(prisma.encaminhamento.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 8, educando: { is: { organizacaoId: 3 } } },
      }),
    );
    expect(res.body.descricao).toBe('Encaminhado para atendimento especializado.');
  });

  it('GET por id inexistente responde 404', async () => {
    prisma.encaminhamento.findFirst.mockResolvedValue(null);

    const res = await chamar('get', '/api/encaminhamentos/999');

    expect(res.status).toBe(404);
  });

  it('POST recusa educando de outra organização', async () => {
    prisma.educando.findFirst.mockResolvedValue(null);

    const res = await chamar('post', '/api/encaminhamentos').send({
      educandoId: 99,
      descricao: 'Tentativa em educando de outra organização.',
    });

    expect(res.status).toBe(400);
    expect(prisma.educando.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99, organizacaoId: 3 } }),
    );
    expect(prisma.encaminhamento.create).not.toHaveBeenCalled();
  });

  it.each(['put', 'delete'] as const)('não existe %s para o encaminhamento original', async (metodo) => {
    const res = await chamar(metodo, '/api/encaminhamentos/8');

    expect(res.status).toBe(404);
  });
});

describe('CreateEncaminhamentoDto', () => {
  it('aceita descrição de texto', async () => {
    const { valor, erros } = await validarDto(CreateEncaminhamentoDto, {
      educandoId: 15,
      descricao: 'Encaminhado para o CAPS.',
    });
    expect(erros).toBeUndefined();
    expect(valor?.descricao).toBe('Encaminhado para o CAPS.');
  });

  it('recusa descrição que não é texto', async () => {
    const { erros } = await validarDto(CreateEncaminhamentoDto, {
      educandoId: 15,
      descricao: 123,
    });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('descricao')]));
  });

  it('aceita descrição com exatamente 2000 caracteres', async () => {
    const { erros } = await validarDto(CreateEncaminhamentoDto, {
      educandoId: 15,
      descricao: 'a'.repeat(2000),
    });
    expect(erros).toBeUndefined();
  });
});
