import { IsNotEmpty, IsString } from 'class-validator';
import { NormalizarEmail } from '../../../common/transformers/normalizar-email';

export class LoginDto {
  @NormalizarEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  senha: string;
}
