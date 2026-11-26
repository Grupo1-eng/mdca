import { BadRequestException, NotFoundException } from '@nestjs/common';

import { validarDto } from '../../../../test/validar-dto';
import { ConsultaListaPresencaDto } from './dto/consulta-lista-presenca.dto';
import { FrequenciasService } from './frequencias.service';
import { montarListaPresenca } from './lista-presenca';

const f = (educandoId: number, nome: string, presente: boolean) => ({
  educandoId,
  presencaAusencia: presente ? 'presente' : 'ausente',
  educando: { nome },
});

describe('montarListaPresenca', () => {
  it('cruza educandos e encontros, com totais, e inclui quem saiu da iniciativa', () => {
    const linhas = montarListaPresenca(
      [
        { id: 10, dataInicio: null, horaInicio: null, situacao: 'realizado', frequencias: [f(1, 'Bia', true), f(3, 'Caio', false)] },
        { id: 11, dataInicio: null, horaInicio: null, situacao: 'realizado', frequencias: [f(1, 'Bia', false)] },
        { id: 12, dataInicio: null, horaInicio: null, situacao: 'agendado', frequencias: [] },
      ],
      [
        { id: 1, nome: 'Bia' },
        { id: 2, nome: 'Ana' },
      ],
    );

    expect(linhas).toEqual([
      { educandoId: 2, nome: 'Ana', presencas: {}, totalPresencas: 0, totalAusencias: 0 },
      { educandoId: 1, nome: 'Bia', presencas: { 10: true, 11: false }, totalPresencas: 1, totalAusencias: 1 },
      // Caio não está mais vinculado, mas tem registro no período.
      { educandoId: 3, nome: 'Caio', presencas: { 10: false }, totalPresencas: 0, totalAusencias: 1 },
    ]);
  });
});

describe('FrequenciasService.listaDePresenca', () => {
  function prismaFalso() {
    return {
      atividade: { findFirst: jest.fn() },
      encontro: { findMany: jest.fn().mockResolvedValue([]) },
      educando: { findMany: jest.fn().mockResolvedValue([]) },
    };
  }

  it('busca encontros não cancelados da atividade, por dia, no período', async () => {
    const prisma = prismaFalso();
    prisma.atividade.findFirst.mockResolvedValue({
      id: 4,
      nome: 'Oficina',
      projetoId: 5,
      projeto: { id: 5, nome: 'Projeto' },
    });
    const service = new FrequenciasService(prisma as any);

    const r = await service.listaDePresenca(4, '2026-11-01', '2026-11-30', 3);

    expect(prisma.atividade.findFirst.mock.calls[0][0].where).toEqual({
      id: 4,
      projeto: { is: { organizacaoId: 3 } },
    });
    const where = prisma.encontro.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ atividadeId: 4, situacao: { not: 'cancelado' } });
    expect(where.dataInicio.gte.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(where.dataInicio.lt.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(prisma.educando.findMany.mock.calls[0][0].where).toMatchObject({
      organizacaoId: 3,
      situacaoAtual: 'ativo',
    });
    expect(r).toMatchObject({
      atividade: { id: 4, nome: 'Oficina', iniciativa: { id: 5, nome: 'Projeto' } },
      periodo: { inicio: '2026-11-01', fim: '2026-11-30' },
      encontros: [],
      linhas: [],
    });
  });

  it('atividade de outra organização: 404; período invertido ou data inexistente: 400', async () => {
    const prisma = prismaFalso();
    prisma.atividade.findFirst.mockResolvedValue(null);
    const service = new FrequenciasService(prisma as any);

    await expect(service.listaDePresenca(4, '2026-11-01', '2026-11-30', 3)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.listaDePresenca(4, '2026-12-01', '2026-11-30', 3)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.listaDePresenca(4, '2026-11-01', '2026-11-31', 3)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa datas fora do formato AAAA-MM-DD', async () => {
    expect((await validarDto(ConsultaListaPresencaDto, { inicio: '2026-11-01', fim: '2026-11-30' })).erros).toBeUndefined();
    expect((await validarDto(ConsultaListaPresencaDto, { inicio: '01/11/2026', fim: '2026-11-30' })).erros).toEqual([
      'Informe a data inicial no formato AAAA-MM-DD.',
    ]);
  });
});
