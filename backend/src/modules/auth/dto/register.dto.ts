import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizarEmail } from '../../../common/transformers/normalizar-email';

// O perfil NÃO faz parte do DTO: o cliente não escolhe o próprio perfil.
// O service atribui um perfil padrão fixo (ex.: PERFIS.ADMINISTRATIVO).
// Como o ValidationPipe global usa `whitelist: true`, qualquer `perfil`
// enviado no body é descartado antes de chegar ao service.
export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(120)
  nome: string;

  @ApiProperty({ example: 'maria@mdca.org' })
  @NormalizarEmail()
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({ minLength: 8, example: 'senhaSegura123' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  senha: string;

  // Necessário porque `Usuario.organizacaoId` é obrigatório no schema.
  // Se o time decidir por organização única, remova este campo e
  // resolva o id no service.
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'organizacaoId deve ser um número inteiro.' })
  organizacaoId: number;
}