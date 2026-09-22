import { Module } from '@nestjs/common';
import { ContatosModule } from './contatos/contatos.module';
import { CategoriasFinanceirasModule } from './categorias-financeiras/categorias-financeiras.module';
import { ContasFinanceirasModule } from './contas-financeiras/contas-financeiras.module';
import { FontesDeRecursoModule } from './fontes-de-recurso/fontes-de-recurso.module';
import { LancamentosModule } from './lancamentos/lancamentos.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';

@Module({
  imports: [
    ContatosModule,
    CategoriasFinanceirasModule,
    ContasFinanceirasModule,
    FontesDeRecursoModule,
    LancamentosModule,
    OrcamentosModule,
  ],
})
export class FinanceiroModule {}
