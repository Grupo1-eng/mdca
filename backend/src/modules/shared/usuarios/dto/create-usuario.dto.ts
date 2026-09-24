import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizarEmail } from '../../../../common/transformers/normalizar-email';
import { Perfil, PERFIS_TODOS } from '../../../auth/perfis.constants';

// organizacaoId vem do token: a coordenação só cria usuários na própria organização.
export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @NormalizarEmail()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  senha: string;

  @IsIn(PERFIS_TODOS)
  perfil: Perfil;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;
}
