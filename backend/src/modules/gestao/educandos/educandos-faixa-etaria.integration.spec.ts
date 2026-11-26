import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { idadeEm } from './faixa-etaria';

// POST /api/educandos recusa data de nascimento fora de 6 a 17 anos
// (questionário da MDCA, pergunta 4). A edição confere só se a data mudar.
describe('Educandos: faixa etária no cadastro (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    educando: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  // Datas relativas a hoje, para o teste não envelhecer.
  function nascidoHa(anos: number, diasAMais = 0): string {
    const d = new Date();
    d.setUTCFullYear(d.getUTCFullYear() - anos);
    d.setUTCDate(d.getUTCDate() - diasAMais);
    return d.toISOString().slice(0, 10);
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
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Ana',
      email: 'ana@mdca.org.br',
      perfil: 'tecnico_servico_social',
      ativo: true,
    });
    prisma.educando.findFirst.mockResolvedValue(null);
    prisma.educando.create.mockImplementation(({ data }) => ({ id: 1, ...data }));
  });

  function post(corpo: object) {
    return request(app.getHttpServer())
      .post('/api/educandos')
      .set('Authorization', `Bearer ${token}`)
      .send(corpo);
  }

  it('aceita 10 anos', async () => {
    const res = await post({ nome: 'Bia', dataNascimento: nascidoHa(10) });
    expect(res.status).toBe(201);
    expect(prisma.educando.create).toHaveBeenCalled();
  });

  it('recusa 5 anos com mensagem em português e não grava', async () => {
    const data = nascidoHa(5);
    expect(idadeEm(new Date(`${data}T00:00:00Z`))).toBe(5);

    const res = await post({ nome: 'Bia', dataNascimento: data });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/de 6 a 17 anos/);
    expect(prisma.educando.create).not.toHaveBeenCalled();
  });

  it('recusa 18 anos', async () => {
    const res = await post({ nome: 'Bia', dataNascimento: nascidoHa(18, 1) });
    expect(res.status).toBe(400);
    expect(prisma.educando.create).not.toHaveBeenCalled();
  });

  it('sem data de nascimento, o cadastro segue aceito', async () => {
    const res = await post({ nome: 'Bia' });
    expect(res.status).toBe(201);
  });

  describe('edição (PUT)', () => {
    function put(corpo: object) {
      return request(app.getHttpServer())
        .put('/api/educandos/1')
        .set('Authorization', `Bearer ${token}`)
        .send(corpo);
    }

    function existente(dataNascimento: string) {
      prisma.educando.findFirst.mockResolvedValue({
        id: 1,
        organizacaoId: 3,
        nome: 'Bia',
        dataNascimento: new Date(`${dataNascimento}T00:00:00.000Z`),
      });
      prisma.educando.update.mockImplementation(({ data }) => ({ id: 1, ...data }));
    }

    it('quem fez 18 segue editável se a data não muda', async () => {
      const data = nascidoHa(19);
      existente(data);
      const res = await put({ nome: 'Bia Souza', dataNascimento: data });
      expect(res.status).toBe(200);
      expect(prisma.educando.update).toHaveBeenCalled();
    });

    it('recusa trocar a data para fora da faixa', async () => {
      existente(nascidoHa(10));
      const res = await put({ nome: 'Bia', dataNascimento: nascidoHa(4) });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/de 6 a 17 anos/);
      expect(prisma.educando.update).not.toHaveBeenCalled();
    });

    it('aceita trocar a data para dentro da faixa', async () => {
      existente(nascidoHa(10));
      const res = await put({ nome: 'Bia', dataNascimento: nascidoHa(12) });
      expect(res.status).toBe(200);
    });
  });
});
