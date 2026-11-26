import { Matches } from 'class-validator';

import { DATA } from '../../atividades/regras-atividades';

// GET /api/frequencias/atividade/:id?inicio=AAAA-MM-DD&fim=AAAA-MM-DD
export class ConsultaListaPresencaDto {
  @Matches(DATA, { message: 'Informe a data inicial no formato AAAA-MM-DD.' })
  inicio: string;

  @Matches(DATA, { message: 'Informe a data final no formato AAAA-MM-DD.' })
  fim: string;
}
