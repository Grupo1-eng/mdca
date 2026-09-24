import { IsNotEmpty, IsString } from 'class-validator';

// usuarioId vem do token e dataHora é definida pelo banco: um registro de
// auditoria não pode ter autor ou horário escolhidos pelo cliente.
export class CreateAuditoriaDto {
  @IsString()
  @IsNotEmpty()
  recursoId: string;

  @IsString()
  @IsNotEmpty()
  recursoTipo: string;

  @IsString()
  @IsNotEmpty()
  acao: string;
}
