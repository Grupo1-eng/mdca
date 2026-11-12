import { INestApplication, Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ContextoRequisicaoMiddleware, contextoAtual } from './contexto-requisicao';

@Controller('contexto')
class ContextoController {
  @Get()
  async ler() {
    // O contexto precisa sobreviver a um await, como numa chamada ao banco.
    await new Promise((resolve) => setImmediate(resolve));
    return contextoAtual();
  }
}

describe('contexto da requisição', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ContextoController],
    }).compile();
    app = moduleRef.createNestApplication();
    const middleware = new ContextoRequisicaoMiddleware();
    app.use(middleware.use.bind(middleware));
    // Faz o papel do JwtAuthGuard, que preenche req.usuario depois do middleware.
    app.use((req: any, _res: any, next: () => void) => {
      req.usuario = { id: 7, perfil: 'gestor_financeiro', organizacaoId: 3 };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('expõe requestId, user-agent e o usuário preenchido depois do middleware', async () => {
    const res = await request(app.getHttpServer())
      .get('/contexto')
      .set('User-Agent', 'navegador-de-teste');

    expect(res.status).toBe(200);
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
    expect(res.body.userAgent).toBe('navegador-de-teste');
    expect(res.body.ip).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual(expect.objectContaining({ id: 7, organizacaoId: 3 }));
  });

  it('gera um requestId novo por requisição, ignorando o enviado pelo cliente', async () => {
    const a = await request(app.getHttpServer()).get('/contexto').set('X-Request-Id', 'forjado');
    const b = await request(app.getHttpServer()).get('/contexto');

    expect(a.body.requestId).not.toBe('forjado');
    expect(a.body.requestId).not.toBe(b.body.requestId);
  });

  it('fora de uma requisição não há contexto', () => {
    expect(contextoAtual()).toBeUndefined();
  });
});
