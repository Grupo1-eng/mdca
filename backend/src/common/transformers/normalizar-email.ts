import { Transform } from 'class-transformer';

// O e-mail é único no banco; normalizar evita que "Maria@x" e "maria@x"
// virem dois usuários diferentes ou que o login falhe por maiúsculas.
export const NormalizarEmail = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
