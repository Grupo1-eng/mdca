import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

// Colunas Decimal guardam valores exatos; converter para `number` no caminho
// introduziria erros de ponto flutuante (0.1 + 0.2 = 0.30000000000000004).
// O valor segue como texto até o Prisma, que o grava sem arredondar. Um
// número que já chega impreciso fica com mais de 2 casas e é recusado.
export const Dinheiro = ({ permitirNegativo = false } = {}) =>
  applyDecorators(
    Transform(({ value }) => (typeof value === 'number' ? String(value) : value)),
    Matches(permitirNegativo ? /^-?\d{1,13}(\.\d{1,2})?$/ : /^\d{1,13}(\.\d{1,2})?$/, {
      message: ({ property }) =>
        `${property} deve ser um valor${permitirNegativo ? '' : ' positivo'} com até 2 casas decimais, ex.: "1234.56"`,
    }),
  );
