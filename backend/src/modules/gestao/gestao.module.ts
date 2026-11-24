import { Module } from '@nestjs/common';
import { EducandosModule } from './educandos/educandos.module';
import { ResponsaveisFamiliaresModule } from './responsaveis-familiares/responsaveis-familiares.module';
import { EvolucoesModule } from './evolucoes/evolucoes.module';
import { EncaminhamentosModule } from './encaminhamentos/encaminhamentos.module';
import { AcompanhamentosEncaminhamentoModule } from './acompanhamentos-encaminhamento/acompanhamentos-encaminhamento.module';
import { CompromissosModule } from './compromissos/compromissos.module';
import { IniciativasModule } from './iniciativas/iniciativas.module';
import { EducandoProjetosModule } from './educando-projetos/educando-projetos.module';
import { AtividadesModule } from './atividades/atividades.module';
import { EncontrosModule } from './encontros/encontros.module';
import { FrequenciasModule } from './frequencias/frequencias.module';
import { PainelModule } from './painel/painel.module';

@Module({
  imports: [
    EducandosModule,
    ResponsaveisFamiliaresModule,
    EvolucoesModule,
    EncaminhamentosModule,
    AcompanhamentosEncaminhamentoModule,
    CompromissosModule,
    IniciativasModule,
    EducandoProjetosModule,
    AtividadesModule,
    EncontrosModule,
    FrequenciasModule,
    PainelModule,
  ],
})
export class GestaoModule {}
