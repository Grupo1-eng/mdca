import { Reflector } from '@nestjs/core';

import { PERFIS_KEY } from '../../auth/decorators/perfis.decorator';
import { PERFIS } from '../../auth/perfis.constants';
import { EducandosController } from './educandos.controller';

describe('EducandosController — perfis da listagem', () => {
  const perfis = new Reflector().get<string[]>(
    PERFIS_KEY,
    EducandosController.prototype.listarTodos,
  );

  it('libera a listagem para os perfis da Gestão', () => {
    expect(perfis).toEqual(
      expect.arrayContaining([
        PERFIS.COORDENACAO,
        PERFIS.TECNICO_SERVICO_SOCIAL,
        PERFIS.TECNICO_PSICOLOGIA,
        PERFIS.EDUCADOR,
        PERFIS.ADMINISTRATIVO,
      ]),
    );
  });

  it('bloqueia os perfis exclusivos do Financeiro', () => {
    expect(perfis).not.toContain(PERFIS.COORDENADOR_FINANCEIRO);
    expect(perfis).not.toContain(PERFIS.GESTOR_FINANCEIRO);
    expect(perfis).not.toContain(PERFIS.ANALISTA_FINANCEIRO);
  });
});
