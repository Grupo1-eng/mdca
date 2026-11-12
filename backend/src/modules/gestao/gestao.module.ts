import { Module } from '@nestjs/common';
import { EducandosModule } from './educandos/educandos.module';
import { ResponsaveisFamiliaresModule } from './responsaveis-familiares/responsaveis-familiares.module';
import { EvolucoesModule } from './evolucoes/evolucoes.module';
import { EncaminhamentosModule } from './encaminhamentos/encaminhamentos.module';
import { AcompanhamentosEncaminhamentoModule } from './acompanhamentos-encaminhamento/acompanhamentos-encaminhamento.module';
import { CompromissosModule } from './compromissos/compromissos.module';
import { IniciativasModule } from './iniciativas/iniciativas.module';
import { EducandoProjetosModule } from './educando-projetos/educando-projetos.module';

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
  ],
})
export class GestaoModule {}
