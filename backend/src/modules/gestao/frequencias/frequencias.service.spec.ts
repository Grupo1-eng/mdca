import { BadRequestException, NotFoundException } from '@nestjs/common';

import { validarDto } from '../../../../test/validar-dto';
import { RegistrarChamadaDto } from './dto/registrar-chamada.dto';
import { FrequenciasService } from './frequencias.service';

function prismaFalso() {
  return {
    encontro: { findFirst: jest.fn() },
    educando: { findMany: jest.fn(), findFirst: jest.fn() },
    frequencia: { findMany: jest.fn(), upsert: jest.fn((args) => args) },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };
}

const encontro = (situacao = 'agendado') => ({
  id: 9,
  dataInicio: new Date('2026-11-20T00:00:00.000Z'),
  horaInicio: '14:00',
  situacao,
  atividade: { id: 1, nome: 'Oficina', projetoId: 5, situacao: 'ativa' },
});

describe('FrequenciasService', () => {
  let prisma: ReturnType<typeof prismaFalso>;
  let service: FrequenciasService;

  beforeEach(() => {
    prisma = prismaFalso();
    service = new FrequenciasService(prisma as any);
    prisma.encontro.findFirst.mockResolvedValue(encontro());
    prisma.educando.findMany.mockResolvedValue([
      { id: 2, nome: 'Bia' },
      { id: 1, nome: 'Ana' },
    ]);
    prisma.frequencia.findMany.mockResolvedValue([]);
  });

  it('monta a chamada com os educandos ativos vinculados à iniciativa', async () => {
    const resultado = await service.chamada(9, 3);

    expect(prisma.educando.findMany.mock.calls[0][0].where).toEqual({
      organizacaoId: 3,
      situacaoAtual: 'ativo',
      educandoProjetos: { some: { projetoId: 5, situacao: 'ativo' } },
    });
    expect(resultado.aceitaChamada).toBe(true);
    expect(resultado.linhas.map((l) => [l.nome, l.presente])).toEqual([
      ['Ana', null],
      ['Bia', null],
    ]);
  });

  it('mantém na chamada quem já tem presença gravada, mesmo desvinculado', async () => {
    prisma.frequencia.findMany.mockResolvedValue([
      { educandoId: 1, presencaAusencia: 'presente', observacao: null, educando: { nome: 'Ana' } },
      { educandoId: 8, presencaAusencia: 'ausente', observacao: 'mudou', educando: { nome: 'Caio' } },
    ]);
    const { linhas } = await service.chamada(9, 3);
    expect(linhas).toEqual([
      { educandoId: 1, nome: 'Ana', presente: true, observacao: null, desvinculado: false },
      { educandoId: 2, nome: 'Bia', presente: null, observacao: null, desvinculado: false },
      { educandoId: 8, nome: 'Caio', presente: false, observacao: 'mudou', desvinculado: true },
    ]);
  });

  it('grava a chamada numa transação, com upsert por encontro e educando (RN06)', async () => {
    await service.registrar(9, { registros: [{ educandoId: 1, presente: true }, { educandoId: 2, presente: false, observacao: ' doente ' }] }, 3);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.frequencia.upsert.mock.calls.map(([args]) => args)).toEqual([
      {
        where: { encontroId_educandoId: { encontroId: 9, educandoId: 1 } },
        create: { encontroId: 9, educandoId: 1, presencaAusencia: 'presente', observacao: null },
        update: { presencaAusencia: 'presente', observacao: null },
      },
      {
        where: { encontroId_educandoId: { encontroId: 9, educandoId: 2 } },
        create: { encontroId: 9, educandoId: 2, presencaAusencia: 'ausente', observacao: 'doente' },
        update: { presencaAusencia: 'ausente', observacao: 'doente' },
      },
    ]);
  });

  it('recusa educando fora da chamada, sem gravar nada', async () => {
    await expect(service.registrar(9, { registros: [{ educandoId: 1, presente: true }, { educandoId: 99, presente: true }] }, 3)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('encontro cancelado não recebe chamada', async () => {
    prisma.encontro.findFirst.mockResolvedValue(encontro('cancelado'));
    await expect(service.registrar(9, { registros: [] }, 3)).rejects.toThrow('Encontro cancelado não recebe chamada.');
    expect((await service.chamada(9, 3)).aceitaChamada).toBe(false);
  });

  it('encontro de outra organização responde 404', async () => {
    prisma.encontro.findFirst.mockResolvedValue(null);
    await expect(service.chamada(9, 3)).rejects.toThrow(NotFoundException);
  });

  it('histórico só de educando da organização', async () => {
    prisma.educando.findFirst.mockResolvedValue(null);
    await expect(service.historicoDoEducando(1, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.educando.findFirst.mock.calls[0][0].where).toEqual({ id: 1, organizacaoId: 3 });
  });
});

describe('RegistrarChamadaDto', () => {
  it('recusa o mesmo educando duas vezes', async () => {
    const { erros } = await validarDto(RegistrarChamadaDto, {
      registros: [{ educandoId: 1, presente: true }, { educandoId: 1, presente: false }],
    });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('uma vez só')]));
  });

  it('exige presente como verdadeiro ou falso', async () => {
    const { erros } = await validarDto(RegistrarChamadaDto, { registros: [{ educandoId: 1, presente: 'sim' }] });
    expect(erros).toBeDefined();
  });
});
