import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERFIS_KEY } from '../../auth/decorators/perfis.decorator';
import { PERFIS } from '../../auth/perfis.constants';
import { IniciativasController } from '../iniciativas/iniciativas.controller';
import { IniciativasService } from '../iniciativas/iniciativas.service';
import { EducandoProjetosController } from './educando-projetos.controller';
import { EducandoProjetosService } from './educando-projetos.service';

function prismaFalso() {
  return {
    educando: { findFirst: jest.fn() },
    projeto: { findFirst: jest.fn(), findMany: jest.fn() },
    educandoProjeto: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('EducandoProjetosService', () => {
  let prisma: ReturnType<typeof prismaFalso>;
  let service: EducandoProjetosService;

  beforeEach(() => {
    prisma = prismaFalso();
    service = new EducandoProjetosService(prisma as any);
  });

  it('cria vínculo ativo quando educando e iniciativa são da organização', async () => {
    prisma.educando.findFirst.mockResolvedValue({ id: 1 });
    prisma.projeto.findFirst.mockResolvedValue({ id: 5 });
    prisma.educandoProjeto.findFirst.mockResolvedValue(null);
    prisma.educandoProjeto.create.mockResolvedValue({ id: 9 });

    await service.criar({ educandoId: 1, projetoId: 5 }, 3);

    expect(prisma.educando.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, organizacaoId: 3 } }),
    );
    expect(prisma.projeto.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5, organizacaoId: 3 } }),
    );
    expect(prisma.educandoProjeto.create.mock.calls[0][0].data).toEqual({
      educandoId: 1,
      projetoId: 5,
      situacao: 'ativo',
    });
  });

  it('recusa educando de outra organização', async () => {
    prisma.educando.findFirst.mockResolvedValue(null);
    await expect(service.criar({ educandoId: 1, projetoId: 5 }, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.educandoProjeto.create).not.toHaveBeenCalled();
  });

  it('recusa iniciativa de outra organização', async () => {
    prisma.educando.findFirst.mockResolvedValue({ id: 1 });
    prisma.projeto.findFirst.mockResolvedValue(null);
    await expect(service.criar({ educandoId: 1, projetoId: 5 }, 3)).rejects.toThrow('Iniciativa não encontrada.');
  });

  it('não deixa dois vínculos ativos com a mesma iniciativa', async () => {
    prisma.educando.findFirst.mockResolvedValue({ id: 1 });
    prisma.projeto.findFirst.mockResolvedValue({ id: 5 });
    prisma.educandoProjeto.findFirst.mockResolvedValue({ id: 2 });
    await expect(service.criar({ educandoId: 1, projetoId: 5 }, 3)).rejects.toThrow(ConflictException);
  });

  it('encerrar mantém o registro e muda só a situação', async () => {
    prisma.educandoProjeto.findFirst.mockResolvedValue({ id: 9, situacao: 'ativo' });
    prisma.educandoProjeto.update.mockResolvedValue({ id: 9, situacao: 'encerrado' });
    await service.encerrar(9, 3);
    expect(prisma.educandoProjeto.findFirst.mock.calls[0][0].where).toEqual({
      id: 9,
      educando: { is: { organizacaoId: 3 } },
    });
    expect(prisma.educandoProjeto.update.mock.calls[0][0].data).toEqual({ situacao: 'encerrado' });
  });

  it('encerrar de novo não altera nada', async () => {
    prisma.educandoProjeto.findFirst.mockResolvedValue({ id: 9, situacao: 'encerrado' });
    await service.encerrar(9, 3);
    expect(prisma.educandoProjeto.update).not.toHaveBeenCalled();
  });
});

describe('IniciativasService', () => {
  it('lista só as iniciativas da organização', async () => {
    const prisma = prismaFalso();
    prisma.projeto.findMany.mockResolvedValue([]);
    await new IniciativasService(prisma as any).listar(3);
    expect(prisma.projeto.findMany.mock.calls[0][0].where).toEqual({ organizacaoId: 3 });
  });
});

describe('Perfis das rotas de iniciativas e vínculos', () => {
  const reflector = new Reflector();
  const perfisDe = (alvo: any) => reflector.get<string[]>(PERFIS_KEY, alvo);
  const financeiros = [PERFIS.COORDENADOR_FINANCEIRO, PERFIS.GESTOR_FINANCEIRO, PERFIS.ANALISTA_FINANCEIRO];

  it('perfis financeiros não consultam iniciativas nem vínculos', () => {
    for (const perfis of [
      perfisDe(IniciativasController),
      perfisDe(EducandoProjetosController.prototype.listarPorEducando),
    ]) {
      for (const p of financeiros) expect(perfis).not.toContain(p);
      expect(perfis).toContain(PERFIS.EDUCADOR);
    }
  });

  it('só técnicos e coordenação gravam vínculos', () => {
    expect(perfisDe(EducandoProjetosController)).toEqual([
      PERFIS.COORDENACAO,
      PERFIS.TECNICO_SERVICO_SOCIAL,
      PERFIS.TECNICO_PSICOLOGIA,
    ]);
  });
});
