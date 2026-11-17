import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RegistroPresencaDto {
  @Type(() => Number)
  @IsInt()
  educandoId!: number;

  @IsBoolean()
  presente!: boolean;

  @IsOptional()
  @IsString()
  observacao?: string | null;
}

// A chamada inteira de um encontro. Regravar atualiza em vez de duplicar (RN06).
export class RegistrarChamadaDto {
  @IsArray()
  @ArrayUnique((r: RegistroPresencaDto) => r.educandoId, {
    message: 'Cada educando aparece uma vez só na chamada.',
  })
  @ValidateNested({ each: true })
  @Type(() => RegistroPresencaDto)
  registros!: RegistroPresencaDto[];
}
