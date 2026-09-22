import { Module } from '@nestjs/common';
import { OrganizacoesModule } from './organizacoes/organizacoes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProjetosModule } from './projetos/projetos.module';
import { AuditoriasModule } from './auditorias/auditorias.module';

@Module({
  imports: [
    OrganizacoesModule,
    UsuariosModule,
    ProjetosModule,
    AuditoriasModule,
  ],
})
export class SharedModule {}
