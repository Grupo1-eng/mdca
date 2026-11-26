import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { validarDto } from '../../../../test/validar-dto';
import { PERFIS_KEY } from '../../auth/decorators/perfis.decorator';
import { PERFIS } from '../../auth/perfis.constants';
import { EncontrosController } from '../encontros/encontros.controller';
import { EncontrosService } from '../encontros/encontros.service';
import { CreateEncontroDto } from '../encontros/dto/create-encontro.dto';
import { FrequenciasController } from '../frequencias/frequencias.controller';
import { PERFIS_EXPORTAM_RELATORIOS, PERFIS_GESTAO } from '../perfis-gestao';
import { AtividadesController } from './atividades.controller';
import { AtividadesService } from './atividades.service';
import { aceitaChamada, aceitaEncontroNovo, intervaloDeDias } from './regras-atividades';

function prismaFalso() {
  return {
    usuario: { findMany: jest.fn(), findFirst: jest.fn() },
    projeto: { findFirst: jest.fn() },
    atividade: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    encontro: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

const novaAtividade = { projetoId: 5, responsavelId: 7, nome: ' Oficina de música ' };

describe('AtividadesService', () => {
  let prisma: ReturnType<typeof prismaFalso>;
  let service: AtividadesService;

  beforeEach(() => {
    prisma = prismaFalso();
    service = new AtividadesService(prisma as any);
  });

  it('lista como responsáveis só usuários ativos da organização, da coordenação ou educador', async () => {
    prisma.usuario.findMany.mockResolvedValue([]);
    await service.listarResponsaveis(3);
    expect(prisma.usuario.findMany.mock.calls[0][0].where).toEqual({
      organizacaoId: 3,
      ativo: true,
      perfil: { in: [PERFIS.COORDENACAO, PERFIS.EDUCADOR] },
    });
  });

  it('cria atividade ativa na iniciativa da organização', async () => {
    prisma.projeto.findFirst.mockResolvedValue({ id: 5 });
    prisma.usuario.findFirst.mockResolvedValue({ id: 7 });
    prisma.atividade.create.mockResolvedValue({ id: 1 });

    await service.criar(novaAtividade, 3);

    expect(prisma.projeto.findFirst.mock.calls[0][0].where).toEqual({ id: 5, organizacaoId: 3 });
    expect(prisma.atividade.create.mock.calls[0][0].data).toEqual({
      projetoId: 5,
      responsavelId: 7,
      nome: 'Oficina de música',
      descricao: null,
      situacao: 'ativa',
    });
  });

  it('recusa iniciativa de outra organização', async () => {
    prisma.projeto.findFirst.mockResolvedValue(null);
    await expect(service.criar(novaAtividade, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.atividade.create).not.toHaveBeenCalled();
  });

  it('recusa responsável inativo, de outra organização ou sem perfil permitido', async () => {
    prisma.projeto.findFirst.mockResolvedValue({ id: 5 });
    prisma.usuario.findFirst.mockResolvedValue(null);
    await expect(service.criar(novaAtividade, 3)).rejects.toThrow(BadRequestException);
    expect(prisma.usuario.findFirst.mock.calls[0][0].where).toEqual({
      id: 7,
      organizacaoId: 3,
      ativo: true,
      perfil: { in: [PERFIS.COORDENACAO, PERFIS.EDUCADOR] },
    });
  });

  it('edita atividade de outra organização como se não existisse (404)', async () => {
    prisma.atividade.findFirst.mockResolvedValue(null);
    await expect(service.atualizar(1, { situacao: 'encerrada' }, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.atividade.findFirst.mock.calls[0][0].where).toEqual({
      id: 1,
      projeto: { is: { organizacaoId: 3 } },
    });
    expect(prisma.atividade.update).not.toHaveBeenCalled();
  });

  it('reabre atividade encerrada', async () => {
    prisma.atividade.findFirst.mockResolvedValue({ id: 1, projetoId: 5, situacao: 'encerrada' });
    prisma.atividade.update.mockResolvedValue({ id: 1 });
    await service.atualizar(1, { situacao: 'ativa' }, 3);
    expect(prisma.atividade.update.mock.calls[0][0].data).toEqual({ situacao: 'ativa' });
  });
});

describe('EncontrosService', () => {
  let prisma: ReturnType<typeof prismaFalso>;
  let service: EncontrosService;

  beforeEach(() => {
    prisma = prismaFalso();
    service = new EncontrosService(prisma as any);
  });

  it('cria encontro planejado com a data só como dia', async () => {
    prisma.atividade.findFirst.mockResolvedValue({ id: 1, projetoId: 5, situacao: 'ativa' });
    prisma.encontro.create.mockResolvedValue({ id: 9 });

    await service.criar({ atividadeId: 1, data: '2026-11-20', horaInicio: '14:00', local: ' Sala 2 ' }, 3);

    expect(prisma.encontro.create.mock.calls[0][0].data).toEqual({
      atividadeId: 1,
      dataInicio: new Date('2026-11-20T00:00:00.000Z'),
      horaInicio: '14:00',
      horaFim: null,
      local: 'Sala 2',
      observacoes: null,
      situacao: 'agendado',
    });
  });

  it('atividade encerrada não aceita encontro novo', async () => {
    prisma.atividade.findFirst.mockResolvedValue({ id: 1, projetoId: 5, situacao: 'encerrada' });
    await expect(service.criar({ atividadeId: 1, data: '2026-11-20' }, 3)).rejects.toThrow(
      'Atividade encerrada não aceita encontros novos',
    );
    expect(prisma.encontro.create).not.toHaveBeenCalled();
  });

  it('cancelar só muda a situação, sem apagar', async () => {
    prisma.encontro.findFirst.mockResolvedValue({ id: 9, situacao: 'agendado', atividade: { projetoId: 5 } });
    prisma.encontro.update.mockResolvedValue({ id: 9 });
    await service.atualizar(9, { situacao: 'cancelado' }, 3);
    expect(prisma.encontro.update.mock.calls[0][0].data).toEqual({ situacao: 'cancelado' });
  });

  it('encontro de outra organização responde 404', async () => {
    prisma.encontro.findFirst.mockResolvedValue(null);
    await expect(service.atualizar(9, { local: 'X' }, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.encontro.findFirst.mock.calls[0][0].where).toEqual({
      id: 9,
      atividade: { is: { projeto: { is: { organizacaoId: 3 } } } },
    });
  });
});

describe('DTO do encontro', () => {
  it('exige data AAAA-MM-DD e horário HH:MM', async () => {
    expect((await validarDto(CreateEncontroDto, { atividadeId: 1, data: '2026-11-20', horaInicio: '09:30' })).erros).toBeUndefined();
    expect((await validarDto(CreateEncontroDto, { atividadeId: 1, data: '20/11/2026' })).erros).toBeDefined();
    expect((await validarDto(CreateEncontroDto, { atividadeId: 1, data: '2026-11-20', horaInicio: '25:00' })).erros).toBeDefined();
    expect((await validarDto(CreateEncontroDto, { atividadeId: 1, data: '2026-11-20', situacao: 'Realizado' })).erros).toBeDefined();
  });
});

describe('intervaloDeDias', () => {
  it('cobre do primeiro ao último dia, em meia-noite UTC (como dataDoDia)', () => {
    const { desde, ate } = intervaloDeDias('2026-11-01', '2026-11-30');
    expect(desde.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(ate.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });
});

describe('regras das decisões', () => {
  it('atividade encerrada não aceita encontro novo (decisão 3)', () => {
    expect(aceitaEncontroNovo({ situacao: 'ativa' })).toBe(true);
    expect(aceitaEncontroNovo({ situacao: 'encerrada' })).toBe(false);
  });

  it('chamada em qualquer encontro não cancelado (decisão 1, provisória)', () => {
    expect(aceitaChamada({ situacao: 'agendado' })).toBe(true);
    expect(aceitaChamada({ situacao: 'realizado' })).toBe(true);
    expect(aceitaChamada({ situacao: 'cancelado' })).toBe(false);
  });
});

describe('perfis das rotas de atividades, encontros e frequência', () => {
  const reflector = new Reflector();
  const perfisDe = (alvo: any) => reflector.get<string[]>(PERFIS_KEY, alvo);

  it.each([
    ['atividades', AtividadesController],
    ['encontros', EncontrosController],
    ['frequências', FrequenciasController],
  ])('em %s, só coordenação e educador gravam', (_nome, controller) => {
    expect(perfisDe(controller)).toEqual([PERFIS.COORDENACAO, PERFIS.EDUCADOR]);
  });

  it('todos os perfis da Gestão consultam', () => {
    const p = AtividadesController.prototype;
    const e = EncontrosController.prototype;
    const f = FrequenciasController.prototype;
    for (const metodo of [p.listar, p.buscar, p.listarResponsaveis, e.listar, e.buscar, f.chamada, f.historico]) {
      expect(perfisDe(metodo)).toEqual(PERFIS_GESTAO);
    }
    for (const metodo of [p.criar, p.atualizar, e.criar, e.atualizar, f.registrar]) {
      expect(perfisDe(metodo)).toBeUndefined();
    }
  });

  it('só coordenação e administrativo tiram a lista de presença', () => {
    expect(perfisDe(FrequenciasController.prototype.listaDePresenca)).toEqual(
      PERFIS_EXPORTAM_RELATORIOS,
    );
    expect(PERFIS_EXPORTAM_RELATORIOS).toEqual([PERFIS.COORDENACAO, PERFIS.ADMINISTRATIVO]);
  });
});
