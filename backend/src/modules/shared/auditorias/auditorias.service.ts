import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FiltroAuditoriaDto, PaginacaoAuditoriaDto } from './dto/filtro-auditoria.dto';
import { gerarCsvAuditoria } from './csv-auditoria';
import { RegistroAuditoriaService } from './registro-auditoria.service';

// Por enquanto só o log do financeiro é consultável; gestão entra depois.
const MODULO = 'financeiro';
const LIMITE_PADRAO = 50;
// Acima disso a exportação é recusada e o usuário precisa restringir o período.
export const LIMITE_EXPORTACAO = 50_000;

const comAutor = { usuario: { select: { id: true, nome: true } } } as const;

// Somente leitura: registros de auditoria são gerados pelo próprio backend,
// nunca enviados pelo cliente. Toda consulta fica restrita à organização do token.
@Injectable()
export class AuditoriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registro: RegistroAuditoriaService,
  ) {}

  async listar(organizacaoId: number, filtro: FiltroAuditoriaDto) {
    return this.paginar(this.where(organizacaoId, filtro), filtro);
  }

  async historico(
    organizacaoId: number,
    recursoTipo: string,
    recursoId: string,
    paginacao: PaginacaoAuditoriaDto,
  ) {
    return this.paginar(
      { organizacaoId, modulo: MODULO, recursoTipo, recursoId },
      paginacao,
    );
  }

  async buscarPorId(organizacaoId: number, id: number) {
    const auditoria = await this.prisma.auditoria.findFirst({
      where: { id, organizacaoId, modulo: MODULO },
      include: comAutor,
    });
    if (!auditoria) {
      throw new NotFoundException('Registro de auditoria não encontrado');
    }
    return auditoria;
  }

  async exportarCsv(organizacaoId: number, filtro: FiltroAuditoriaDto) {
    const where = this.where(organizacaoId, filtro);
    const total = await this.prisma.auditoria.count({ where });
    if (total > LIMITE_EXPORTACAO) {
      throw new BadRequestException(
        `A exportação tem ${total} registros; o máximo é ${LIMITE_EXPORTACAO}. Restrinja o período.`,
      );
    }

    const registros = await this.prisma.auditoria.findMany({
      where,
      include: comAutor,
      orderBy: { id: 'desc' },
    });

    // Exportar o log também é auditado: os dados saem do sistema.
    await this.registro.registrarAvulso({
      acao: 'exportar',
      recursoTipo: 'auditoria',
      resumo: `Exportação CSV do log de auditoria (${registros.length} registros)`,
      alteracoes: { filtro: { para: JSON.stringify(this.semPaginacao(filtro)) } },
    });

    return gerarCsvAuditoria(registros);
  }

  private where(organizacaoId: number, filtro: FiltroAuditoriaDto): Prisma.AuditoriaWhereInput {
    const dataHora: Prisma.DateTimeFilter = {};
    if (filtro.de) dataHora.gte = this.inicio(filtro.de);
    if (filtro.ate) dataHora.lt = this.fim(filtro.ate);

    return {
      organizacaoId,
      modulo: MODULO,
      acao: filtro.acao,
      recursoTipo: filtro.recursoTipo,
      usuarioId: filtro.usuarioId,
      ...(filtro.de || filtro.ate ? { dataHora } : {}),
    };
  }

  private async paginar(where: Prisma.AuditoriaWhereInput, paginacao: PaginacaoAuditoriaDto) {
    const limite = paginacao.limite ?? LIMITE_PADRAO;
    // id cresce na ordem de gravação: ordenar por id é ordenar por data, e o
    // cursor não repete nem pula registros gravados durante a navegação.
    const itens = await this.prisma.auditoria.findMany({
      where: paginacao.cursor ? { AND: [where, { id: { lt: paginacao.cursor } }] } : where,
      include: comAutor,
      orderBy: { id: 'desc' },
      take: limite + 1,
    });
    const temMais = itens.length > limite;
    const pagina = temMais ? itens.slice(0, limite) : itens;
    return { itens: pagina, proximoCursor: temMais ? pagina[pagina.length - 1].id : null };
  }

  // Data sem horário é interpretada no horário de Brasília (UTC-3, sem horário de verão).
  private inicio(data: string) {
    return new Date(data.length === 10 ? `${data}T00:00:00-03:00` : data);
  }

  private fim(data: string) {
    if (data.length !== 10) return new Date(new Date(data).getTime() + 1);
    const inicio = this.inicio(data);
    return new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  }

  private semPaginacao({ cursor: _c, limite: _l, ...filtro }: FiltroAuditoriaDto) {
    return filtro;
  }
}
