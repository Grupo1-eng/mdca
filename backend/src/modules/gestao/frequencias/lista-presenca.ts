// Lista de presença de uma atividade num período (questionário da MDCA,
// perguntas 12, 13 e 21: prestação de contas, quase sempre mensal, no
// formato de cada parceiro). Função pura: monta a grade educando × encontro.
import { PRESENCA } from '../atividades/regras-atividades';

export interface EncontroDaLista {
  id: number;
  dataInicio: Date | null;
  horaInicio: string | null;
  situacao: string;
  frequencias: Array<{
    educandoId: number;
    presencaAusencia: string;
    educando: { nome: string };
  }>;
}

export interface LinhaListaPresenca {
  educandoId: number;
  nome: string;
  // encontroId -> true (presente) | false (ausente); sem chave = sem registro.
  presencas: Record<number, boolean>;
  totalPresencas: number;
  totalAusencias: number;
}

// Linhas: educandos ativos vinculados hoje à iniciativa, mais quem tem
// registro de chamada em algum encontro do período (mesmo desvinculado).
export function montarListaPresenca(
  encontros: EncontroDaLista[],
  vinculados: Array<{ id: number; nome: string }>,
): LinhaListaPresenca[] {
  const linhas = new Map<number, LinhaListaPresenca>();
  const linha = (educandoId: number, nome: string) => {
    let atual = linhas.get(educandoId);
    if (!atual) {
      atual = { educandoId, nome, presencas: {}, totalPresencas: 0, totalAusencias: 0 };
      linhas.set(educandoId, atual);
    }
    return atual;
  };

  for (const e of vinculados) linha(e.id, e.nome);
  for (const encontro of encontros) {
    for (const f of encontro.frequencias) {
      const atual = linha(f.educandoId, f.educando.nome);
      const presente = f.presencaAusencia === PRESENCA;
      atual.presencas[encontro.id] = presente;
      if (presente) atual.totalPresencas += 1;
      else atual.totalAusencias += 1;
    }
  }
  return [...linhas.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
