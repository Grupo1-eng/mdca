import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// O módulo financeiro tem dados sensíveis: só coordenador, gestor e analista
// financeiro entram. Os demais perfis recebem 403 (autenticados, sem permissão).
describe('Acesso ao módulo financeiro por perfil (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: { findMany: jest.fn(), create: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const rotasFinanceiras = [
    '/api/lancamentos',
    '/api/contas-financeiras',
    '/api/categorias-financeiras',
    '/api/contatos',
    '/api/fontes-de-recurso',
    '/api/orcamentos',
  ];
  const perfisPermitidos = [
    'coordenador_financeiro',
    'gestor_financeiro',
    'analista_financeiro',
  ];
  const perfisBloqueados = [
    'coordenador',
    'tecnico_servico_social',
    'tecnico_psicologia',
    'educador',
    'administrativo',
  ];

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
  });

  function logadoComo(perfil: string) {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Teste',
      email: 'teste@mdca.org.br',
      perfil,
      ativo: true,
    });
  }

  it.each(perfisPermitidos)('perfil %s acessa o financeiro', async (perfil) => {
    logadoComo(perfil);
    prisma.lancamento.findMany.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get('/api/lancamentos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it.each(perfisBloqueados)('perfil %s recebe 403 em todas as rotas financeiras', async (perfil) => {
    logadoComo(perfil);

    for (const rota of rotasFinanceiras) {
      const res = await request(app.getHttpServer())
        .get(rota)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    }
  });

  it('perfil sem permissão não consegue gravar lançamento', async () => {
    logadoComo('educador');

    const res = await request(app.getHttpServer())
      .post('/api/lancamentos')
      .set('Authorization', `Bearer ${token}`)
      .send({ contaId: 1, categoriaId: 2, valor: '10.00', tipo: 'saida' });

    expect(res.status).toBe(403);
    expect(prisma.lancamento.create).not.toHaveBeenCalled();
  });

  it('sem token continua 401, não 403', async () => {
    const res = await request(app.getHttpServer()).get('/api/lancamentos');

    expect(res.status).toBe(401);
  });
});
