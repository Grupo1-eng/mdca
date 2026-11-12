import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

// Só a data de ingresso muda. Trocar de iniciativa é encerrar o vínculo e
// criar outro, para manter o histórico.
export class UpdateEducandoProjetoDto {
  @Type(() => Date)
  @IsDate()
  dataIngresso!: Date;
}
